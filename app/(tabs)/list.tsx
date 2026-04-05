import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { eq, sql, desc } from 'drizzle-orm';
import { SegmentControl } from '../../src/components/SegmentControl';
import { RatingStamp } from '../../src/components/RatingStamp';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { createDb } from '../../src/db/client';
import { removeSave } from '../../src/dal/saves';
import { deleteVisitsForHotel } from '../../src/dal/visits';
import * as schema from '../../src/db/schema';
import { formatEmotion } from '../../src/utils/format';
import type { SaveStatus, EmotionTier } from '../../src/types';

const ROW_HEIGHT = 68;

interface ListHotel {
  id: number;
  name: string;
  city: string;
  country: string;
  coverPhoto: string | null;
  saveStatus: SaveStatus;
  rating: number | null;
  emotion: EmotionTier | null;
}

function SwipeableRow({
  children,
  onDelete,
  onTap,
  onLongPress,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const resetPosition = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    isOpen.current = false;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        } else if (isOpen.current) {
          translateX.setValue(Math.min(gestureState.dx - 80, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          Animated.spring(translateX, { toValue: -80, useNativeDriver: true }).start();
          isOpen.current = true;
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const handleContentPress = () => {
    if (isOpen.current) {
      resetPosition();
    } else if (onTap) {
      onTap();
    }
  };

  const handleDelete = () => {
    onDelete();
    resetPosition();
  };

  return (
    <View style={swipeStyles.container}>
      <TouchableOpacity style={swipeStyles.deleteAction} onPress={handleDelete} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={18} color={Colors.white} />
      </TouchableOpacity>
      <Animated.View
        style={[swipeStyles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleContentPress}
          onLongPress={onLongPress}
          delayLongPress={400}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: Colors.background,
  },
});

export default function ListScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [filter, setFilter] = useState('Slept');
  const [hotels, setHotels] = useState<ListHotel[]>([]);
  const [menuHotel, setMenuHotel] = useState<ListHotel | null>(null);
  const [activeDragIdx, setActiveDragIdx] = useState<number | null>(null);
  const dragAnimY = useRef(new Animated.Value(0)).current;
  const dragRefs = useRef({
    isDragging: false,
    startIdx: 0,
    currentIdx: 0,
    swapOffset: 0,
    list: [] as ListHotel[],
  });

  const loadHotels = useCallback(async () => {
    const results = await db
      .select({
        id: schema.hotels.id,
        name: schema.hotels.name,
        city: schema.hotels.city,
        country: schema.hotels.country,
        coverPhoto: schema.hotels.coverPhoto,
        saveStatus: schema.saves.status,
      })
      .from(schema.saves)
      .innerJoin(schema.hotels, eq(schema.saves.hotelId, schema.hotels.id))
      .where(eq(schema.saves.userId, 1))
      .orderBy(desc(schema.saves.createdAt));

    const withVisitData: ListHotel[] = [];
    for (const h of results) {
      const visit = await db
        .select({
          rating: schema.visits.rating,
          emotion: schema.visits.emotion,
        })
        .from(schema.visits)
        .where(sql`${schema.visits.userId} = 1 AND ${schema.visits.hotelId} = ${h.id}`)
        .orderBy(desc(schema.visits.createdAt))
        .limit(1);
      withVisitData.push({
        ...h,
        saveStatus: h.saveStatus as SaveStatus,
        rating: visit[0]?.rating ?? null,
        emotion: (visit[0]?.emotion as EmotionTier) ?? null,
      });
    }
    setHotels(withVisitData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHotels();
    }, [loadHotels])
  );

  const handleDelete = (hotel: ListHotel) => {
    Alert.alert(
      'Remove stay',
      `Are you sure you want to remove ${hotel.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteVisitsForHotel(db, 1, hotel.id);
            await removeSave(db, 1, hotel.id);
            loadHotels();
          },
        },
      ]
    );
  };

  const handleMenuAction = (action: string) => {
    if (!menuHotel) return;
    const hotel = menuHotel;
    setMenuHotel(null);

    switch (action) {
      case 'edit':
        router.push(`/rating/${hotel.id}`);
        break;
      case 'newStay':
        router.push(`/rating/${hotel.id}`);
        break;
      case 'delete':
        handleDelete(hotel);
        break;
    }
  };

  const sleptHotels = hotels
    .filter((h) => h.saveStatus === 'been')
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const savedHotels = hotels.filter((h) => h.saveStatus === 'want');

  // Drag-to-reorder PanResponder
  const dragResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        return dragRefs.current.isDragging && Math.abs(gs.dy) > 2;
      },
      onPanResponderMove: (_, gs) => {
        const refs = dragRefs.current;
        if (!refs.isDragging) return;

        dragAnimY.setValue(gs.dy + refs.swapOffset);

        const targetIdx = refs.startIdx + Math.round(gs.dy / ROW_HEIGHT);
        const clamped = Math.max(0, Math.min(targetIdx, refs.list.length - 1));

        if (clamped !== refs.currentIdx) {
          const newList = [...refs.list];
          const [item] = newList.splice(refs.currentIdx, 1);
          newList.splice(clamped, 0, item);
          refs.list = newList;
          refs.swapOffset -= (clamped - refs.currentIdx) * ROW_HEIGHT;
          dragAnimY.setValue(gs.dy + refs.swapOffset);
          refs.currentIdx = clamped;

          setActiveDragIdx(clamped);
          setHotels((prev) => {
            const nonSlept = prev.filter((h) => h.saveStatus !== 'been');
            return [...nonSlept, ...newList];
          });
        }
      },
      onPanResponderRelease: () => {
        const refs = dragRefs.current;
        if (!refs.isDragging) return;
        refs.isDragging = false;

        Animated.spring(dragAnimY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }).start(() => {
          setActiveDragIdx(null);
          dragRefs.current.swapOffset = 0;
        });
      },
      onPanResponderTerminate: () => {
        dragRefs.current.isDragging = false;
        dragRefs.current.swapOffset = 0;
        dragAnimY.setValue(0);
        setActiveDragIdx(null);
      },
    })
  ).current;

  const handleDragStart = (index: number) => {
    if (activeDragIdx !== null) return;
    dragRefs.current = {
      isDragging: true,
      startIdx: index,
      currentIdx: index,
      swapOffset: 0,
      list: [...sleptHotels],
    };
    dragAnimY.setValue(0);
    setActiveDragIdx(index);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My List</Text>
        </View>

        <View style={styles.segmentContainer}>
          <SegmentControl
            options={['Slept', 'Saved']}
            selected={filter}
            onChange={(val) => {
              setFilter(val);
              setActiveDragIdx(null);
              dragRefs.current.isDragging = false;
            }}
          />
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.listContent}
          scrollEnabled={activeDragIdx === null}
          showsVerticalScrollIndicator={false}
        >
          {filter === 'Slept' ? (
            sleptHotels.length > 0 ? (
              sleptHotels.map((item, index) => {
                const isDragging = activeDragIdx === index;
                return (
                  <Animated.View
                    key={item.id}
                    style={[
                      isDragging && {
                        transform: [{ translateY: dragAnimY }],
                        zIndex: 999,
                        elevation: 10,
                      },
                    ]}
                    {...dragResponder.panHandlers}
                  >
                    <SwipeableRow
                      onDelete={() => handleDelete(item)}
                      onTap={() => {
                        if (activeDragIdx !== null) return;
                        router.push(`/hotel/${item.id}`);
                      }}
                      onLongPress={() => handleDragStart(index)}
                    >
                      <View
                        style={[
                          styles.sleptItem,
                          isDragging && styles.sleptItemDragging,
                        ]}
                      >
                        <Text style={styles.rank}>{index + 1}</Text>
                        <View style={styles.sleptInfo}>
                          <Text style={styles.hotelName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.hotelLocation}>
                            {item.city}, {item.country}
                            {item.emotion
                              ? ` \u00B7 ${formatEmotion(item.emotion)}`
                              : ''}
                          </Text>
                        </View>
                        <RatingStamp score={item.rating} size="small" />
                        {!isDragging && (
                          <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => setMenuHotel(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons
                              name="ellipsis-vertical"
                              size={16}
                              color={Colors.textLight}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </SwipeableRow>
                  </Animated.View>
                );
              })
            ) : (
              <EmptyState
                icon="bed-outline"
                message="No hotels rated yet"
                actionLabel="Search Hotels"
                onAction={() => router.push('/search')}
              />
            )
          ) : savedHotels.length > 0 ? (
            savedHotels.map((item) => (
              <SwipeableRow
                key={item.id}
                onDelete={() => handleDelete(item)}
                onTap={() => router.push(`/hotel/${item.id}`)}
              >
                <View style={styles.savedItem}>
                  <Ionicons name="star" size={16} color={Colors.accent} />
                  <View style={styles.savedInfo}>
                    <Text style={styles.hotelName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.hotelLocation}>
                      {item.city}, {item.country}
                    </Text>
                  </View>
                </View>
              </SwipeableRow>
            ))
          ) : (
            <EmptyState
              icon="star-outline"
              message="No hotels saved yet"
              actionLabel="Search Hotels"
              onAction={() => router.push('/search')}
            />
          )}
        </ScrollView>
      </View>

      {/* 3-dot menu modal */}
      <Modal visible={menuHotel !== null} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuHotel(null)}
        >
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {menuHotel?.name}
            </Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('edit')}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color={Colors.text} />
              <Text style={styles.menuItemText}>Edit ranking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('newStay')}
              activeOpacity={0.7}
            >
              <Ionicons name="add-outline" size={18} color={Colors.text} />
              <Text style={styles.menuItemText}>Add new stay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('delete')}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.accent} />
              <Text style={[styles.menuItemText, { color: Colors.accent }]}>
                Delete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuCancel}
              onPress={() => setMenuHotel(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.padding,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    ...Typography.heading1,
    color: Colors.text,
  },
  segmentContainer: {
    paddingHorizontal: Layout.padding,
    marginBottom: 8,
  },
  scrollArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Layout.padding,
    paddingBottom: 20,
  },
  sleptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  sleptItemDragging: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    marginHorizontal: -4,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  rank: {
    width: 24,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sleptInfo: {
    flex: 1,
  },
  hotelName: {
    ...Typography.bodyBold,
    fontFamily: Typography.heading3.fontFamily,
    color: Colors.text,
  },
  hotelLocation: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuButton: {
    padding: 4,
    marginLeft: 4,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  savedInfo: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingBottom: 34,
    paddingHorizontal: Layout.padding,
  },
  menuTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuItemText: {
    fontSize: Typography.body.fontSize,
    color: Colors.text,
  },
  menuCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  menuCancelText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
