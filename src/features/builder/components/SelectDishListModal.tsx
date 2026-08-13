import React, { useCallback, useEffect, useState } from "react";
import { DishListPickerModal } from "@features/dishlist";

interface SelectDishListModalProps {
  visible: boolean;
  onClose: () => void;
  onDone: (dishListIds: string[]) => void;
  saving?: boolean;
}

export function SelectDishListModal({
  visible,
  onClose,
  onDone,
  saving = false,
}: SelectDishListModalProps) {
  const [selectedDishListIds, setSelectedDishListIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (visible) setSelectedDishListIds(new Set());
  }, [visible]);

  const handleToggle = useCallback((dishListId: string) => {
    setSelectedDishListIds((current) => {
      const next = new Set(current);
      if (next.has(dishListId)) {
        next.delete(dishListId);
      } else {
        next.add(dishListId);
      }
      return next;
    });
  }, []);

  return (
    <DishListPickerModal
      visible={visible}
      onClose={onClose}
      onSelect={handleToggle}
      onDone={() => onDone(Array.from(selectedDishListIds))}
      title="Save to DishList"
      selectedDishListIds={Array.from(selectedDishListIds)}
      selectionMode="multiple"
      isSelecting={saving}
      selectingMessage="Saving recipe..."
    />
  );
}
