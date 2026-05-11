import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { REGISTRY_BY_KEY } from '../../constants/service-registry';
import type { OtpEntry } from '../../types';
import { InitialsAvatar } from './InitialsAvatar';

type ServiceIconProps = {
  entry: OtpEntry;
  size?: number;
};

function ServiceIconBase({ entry, size = 32 }: ServiceIconProps) {
  const isCustom = entry.iconSource === 'custom' || (!entry.iconSource && Boolean(entry.iconUrl));
  if (isCustom && entry.iconUrl) {
    return <Image source={{ uri: entry.iconUrl }} style={[styles.image, { width: size, height: size, borderRadius: size / 4 }]} />;
  }

  const isService = entry.iconSource === 'service' || (!entry.iconSource && Boolean(entry.iconKey));
  const serviceEntry = isService && entry.iconKey ? REGISTRY_BY_KEY[entry.iconKey] : undefined;

  if (serviceEntry) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 4 }]}>
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d={serviceEntry.svgPath} fill={`#${serviceEntry.hex}`} />
        </Svg>
      </View>
    );
  }

  return <InitialsAvatar issuer={entry.issuer} size={size} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
});

export const ServiceIcon = memo(ServiceIconBase);
