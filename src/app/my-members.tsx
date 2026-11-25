import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { DistrictRow } from '@/components/district-row';
import { MemberRow } from '@/components/member-row';
import { ErrorState, LoadingState } from '@/components/screen-states';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCurrentMembers } from '@/hooks/use-current-members';
import { useTheme } from '@/hooks/use-theme';
import { ordinal } from '@/lib/congress';
import { lookupDistrict, type District, type LocationQuery, type LookupError } from '@/lib/district-lookup';
import { isDelegate, membersForDistrict, placeLabel, type Member } from '@/lib/members';
import { clearSavedDistrict, loadSavedDistrict, saveDistrict } from '@/lib/saved-district';
import { parseZip } from '@/lib/zip-lookup';

type FindError = LookupError | 'zipNotFound' | 'permissionDenied' | 'locationUnavailable';

const ERROR_MESSAGES: Record<FindError, string> = {
  notFound:
    'We couldn’t find that address. Check the street, city, and state, or choose your district instead.',
  ambiguous:
    'That address matches more than one district. Add more detail, such as the ZIP code, or choose your district instead.',
  noMatchingMap:
    'District maps for the current Congress aren’t available right now. Please choose your district instead.',
  network:
    'Couldn’t reach the U.S. Census Bureau. Check your connection, or choose your district instead.',
  permissionDenied:
    'Location access is off for GovQL. Type your address instead, or turn on location for GovQL in Settings.',
  locationUnavailable: 'Couldn’t get your location. Try again, or type your address instead.',
  zipNotFound:
    'We couldn’t find that ZIP code. Some ZIP codes, such as PO boxes, aren’t on the Census district maps. Enter your street address instead.',
  zipNotUpdated:
    'ZIP code lookup hasn’t been updated for the new congressional districts yet. Enter your street address or use your location instead.',
};

// Find my members: address, current location, or choosing a district. Only the resulting
// { state, district, congress } is saved on the device; the address and coordinates are not.
export default function MyMembersScreen() {
  const router = useRouter();
  const { members, congress, today, loading, error, refetch } = useCurrentMembers();
  const [saved, setSaved] = useState<District | null>(() => loadSavedDistrict());

  // Pick up a district chosen on the "Choose my district" screens.
  useFocusEffect(
    useCallback(() => {
      setSaved(loadSavedDistrict());
    }, [])
  );

  if (members.length === 0) {
    if (error && !loading) {
      return (
        <ErrorState
          message="Couldn’t load members of Congress. Check your connection and try again."
          detail={error.message}
          onRetry={refetch}
        />
      );
    }
    return <LoadingState label="Loading members of Congress…" />;
  }

  const onFound = (district: District) => {
    saveDistrict(district);
    setSaved(district);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.content}>
      {saved ? (
        <SavedMembers
          members={members}
          saved={saved}
          currentCongress={congress}
          onChange={() => {
            clearSavedDistrict();
            setSaved(null);
          }}
        />
      ) : (
        <FindForm
          members={members}
          congress={congress}
          today={today}
          onFound={onFound}
          onChoose={() => router.push('/choose-district')}
        />
      )}
    </ScrollView>
  );
}

function SavedMembers({
  members,
  saved,
  currentCongress,
  onChange,
}: {
  members: Member[];
  saved: District;
  currentCongress: number | null;
  onChange: () => void;
}) {
  const { senators, representative } = membersForDistrict(members, saved.state, saved.district);
  const outdated = currentCongress !== null && saved.congress !== currentCongress;
  const delegateSeat = isDelegate({ chamber: 'house', state: saved.state });

  const houseHeading = !delegateSeat
    ? 'Representative'
    : saved.state === 'PR'
      ? 'Resident Commissioner'
      : 'Delegate';

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">{placeLabel(saved.state, saved.district)}</ThemedText>

      {outdated ? (
        <ThemedText type="small" themeColor="textSecondary">
          You saved this district for the {ordinal(saved.congress)} Congress. Districts may have been
          redrawn since, so please check your location again.
        </ThemedText>
      ) : null}

      <ThemedText type="smallBold" accessibilityRole="header" style={styles.heading}>
        Senators
      </ThemedText>
      {senators.length > 0 ? (
        senators.map((m) => <MemberRow key={m.bioguideId} member={m} />)
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {delegateSeat
            ? 'The District of Columbia and U.S. territories have no senators.'
            : 'No senators found for this state.'}
        </ThemedText>
      )}

      <ThemedText type="smallBold" accessibilityRole="header" style={styles.heading}>
        {houseHeading}
      </ThemedText>
      {representative ? (
        <MemberRow member={representative} />
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          This seat is currently vacant.
        </ThemedText>
      )}

      <View style={styles.actions}>
        <Button
          label={outdated ? 'Check my location again' : 'Change location'}
          variant="secondary"
          onPress={onChange}
        />
      </View>
    </View>
  );
}

function FindForm({
  members,
  congress,
  today,
  onFound,
  onChoose,
}: {
  members: Member[];
  congress: number | null;
  today: string;
  onFound: (district: District) => void;
  onChoose: () => void;
}) {
  const theme = useTheme();
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState<'address' | 'location' | null>(null);
  const [findError, setFindError] = useState<FindError | null>(null);
  // Districts a ZIP code spans, for the user to pick from (never picked for them).
  const [choices, setChoices] = useState<{ zip: string; districts: District[] } | null>(null);

  const find = async (query: LocationQuery) => {
    if (congress === null) {
      setFindError('noMatchingMap');
      return;
    }
    const result = await lookupDistrict(query, congress, { today });
    if (result.ok) onFound(result.district);
    else if (query.kind === 'zip' && result.choices) setChoices({ zip: query.zip, districts: result.choices });
    else if (query.kind === 'zip' && result.error === 'notFound') setFindError('zipNotFound');
    else setFindError(result.error);
  };

  const reset = () => {
    setFindError(null);
    setChoices(null);
  };

  // The field takes a street address or a ZIP code; a ZIP is looked up on the phone.
  const findByAddress = async () => {
    reset();
    setBusy('address');
    try {
      const zip = parseZip(address);
      await find(zip ? { kind: 'zip', zip } : { kind: 'address', address });
    } finally {
      setBusy(null);
    }
  };

  const findByLocation = async () => {
    reset();
    setBusy('location');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setFindError('permissionDenied');
        return;
      }
      let position: Location.LocationObject;
      try {
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch {
        setFindError('locationUnavailable');
        return;
      }
      await find({
        kind: 'coordinates',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">Find my members</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Enter your home address or ZIP code to see your two senators and your representative in
        the House.
      </ThemedText>

      <TextInput
        value={address}
        onChangeText={(text) => {
          setAddress(text);
          setChoices(null);
        }}
        placeholder="Street address, or ZIP code"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Home address or ZIP code"
        autoComplete="street-address"
        textContentType="fullStreetAddress"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => address.trim() && !busy && findByAddress()}
        editable={!busy}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
      />
      <Button
        label="Find my members"
        onPress={findByAddress}
        loading={busy === 'address'}
        disabled={!address.trim() || busy !== null}
      />
      <Button
        label="Use my location"
        variant="secondary"
        onPress={findByLocation}
        loading={busy === 'location'}
        disabled={busy !== null}
      />

      {choices ? (
        <ZipChoices
          zip={choices.zip}
          districts={choices.districts}
          members={members}
          onChoose={onFound}
        />
      ) : null}

      {findError ? (
        <ThemedText type="small" style={{ color: theme.danger }} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {ERROR_MESSAGES[findError]}
        </ThemedText>
      ) : null}

      <Button label="Choose my state and district" variant="link" onPress={onChoose} disabled={busy !== null} />

      <ThemedText type="small" themeColor="textSecondary" style={styles.privacy}>
        Your address or location is sent only to the U.S. Census Bureau to find your district. A ZIP
        code is looked up on this phone and isn’t sent anywhere. GovQL doesn’t receive or store any
        of them; only your state and district are kept on this phone.
      </ThemedText>
    </View>
  );
}

/** A ZIP code that spans districts: list every one, with its member, for the user to pick. */
function ZipChoices({
  zip,
  districts,
  members,
  onChoose,
}: {
  zip: string;
  districts: District[];
  members: Member[];
  onChoose: (district: District) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.choices}>
      <ThemedText type="small" accessibilityLiveRegion="polite">
        ZIP code {zip} is in {districts.length} congressional districts. Choose yours:
      </ThemedText>
      <View style={[styles.choiceList, { borderColor: theme.border }]}>
        {districts.map((d, i) => (
          <View key={`${d.state}-${d.district}`}>
            {i > 0 ? <View style={[styles.separator, { backgroundColor: theme.border }]} /> : null}
            <DistrictRow
              state={d.state}
              district={d.district}
              member={membersForDistrict(members, d.state, d.district).representative}
              onPress={() => onChoose(d)}
            />
          </View>
        ))}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Not sure which? Enter your full street address above, or use your location.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  heading: {
    paddingTop: Spacing.three,
  },
  actions: {
    paddingTop: Spacing.four,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 44,
    fontSize: 16,
  },
  privacy: {
    paddingTop: Spacing.three,
  },
  choices: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  choiceList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three,
  },
});
