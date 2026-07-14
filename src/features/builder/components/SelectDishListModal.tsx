import React from "react";
import { DishListPickerModal } from "@features/dishlist";

interface SelectDishListModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dishListId: string) => void;
  saving?: boolean;
}

export function SelectDishListModal({
  visible,
  onClose,
  onSelect,
  saving = false,
}: SelectDishListModalProps) {
  return (
    <DishListPickerModal
      visible={visible}
      onClose={onClose}
      onSelect={onSelect}
      title="Save to DishList"
      isSelecting={saving}
      selectingMessage="Saving recipe..."
    />
  );
}
