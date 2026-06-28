'use client';
import React from 'react';
import { FlatList as RNFlatList, Platform, type FlatListProps } from 'react-native';

// Performance-optimized FlatList with Android defaults
function FlatListInner<ItemT = any>(
  props: FlatListProps<ItemT>,
  ref: React.ForwardedRef<RNFlatList<ItemT>>,
): React.JSX.Element {
  // Apply Android-specific performance defaults if not explicitly overridden
  const optimizedProps = Platform.OS === 'android' ? {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 5,
    updateCellsBatchingPeriod: 100,
    initialNumToRender: 5,
    windowSize: 5,
    ...props,
  } : props;

  return <RNFlatList ref={ref} {...optimizedProps} />;
}

export const FlatList = React.forwardRef(FlatListInner) as <ItemT = any>(
  props: FlatListProps<ItemT> & React.RefAttributes<RNFlatList<ItemT>>,
) => React.JSX.Element;

// Also export the original for advanced use cases
export { FlatList as RNFlatList } from 'react-native';
