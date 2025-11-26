export interface GroceryItem {
  id: string;
  text: string;
  checked: boolean;
  addedAt: number;
}

export interface GroceryListState {
  items: GroceryItem[];
  isLoading: boolean;
  isAddingItem: boolean;
  editingText: string;
}

export interface GroceryActions {
  loadItems: () => Promise<void>;
  addItems: (texts: string[]) => Promise<void>;
  toggleCheck: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  checkAll: () => Promise<void>;
  uncheckAll: () => Promise<void>;
  setIsAddingItem: (value: boolean) => void;
  setEditingText: (value: string) => void;
}