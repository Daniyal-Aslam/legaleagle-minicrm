"use client";

import { create } from "zustand";

type ContactFormState = { open: false } | { open: true; mode: "create" } | { open: true; mode: "edit"; contactId: string };

interface UiState {
  contactForm: ContactFormState;
  quickFindOpen: boolean;
  openCreateContact(): void;
  openEditContact(contactId: string): void;
  closeContactForm(): void;
  setQuickFindOpen(open: boolean): void;
}

/** Ephemeral UI state (dialogs) that several unrelated components open. */
export const useUiStore = create<UiState>()((set) => ({
  contactForm: { open: false },
  quickFindOpen: false,
  openCreateContact: () => set({ contactForm: { open: true, mode: "create" } }),
  openEditContact: (contactId) => set({ contactForm: { open: true, mode: "edit", contactId } }),
  closeContactForm: () => set({ contactForm: { open: false } }),
  setQuickFindOpen: (quickFindOpen) => set({ quickFindOpen }),
}));
