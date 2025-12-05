import { create } from 'zustand';
import type { Whitelist, Answer } from '@/types';

interface WhitelistState {
  currentWhitelist: Whitelist | null;
  currentAnswers: Answer[];
  setCurrentWhitelist: (whitelist: Whitelist | null) => void;
  setCurrentAnswers: (answers: Answer[]) => void;
  updateAnswer: (answerId: string, data: Partial<Answer>) => void;
  resetWhitelist: () => void;
}

export const useWhitelistStore = create<WhitelistState>((set) => ({
  currentWhitelist: null,
  currentAnswers: [],

  setCurrentWhitelist: (whitelist) => {
    set({ currentWhitelist: whitelist });
  },

  setCurrentAnswers: (answers) => {
    set({ currentAnswers: answers });
  },

  updateAnswer: (answerId, data) => {
    set((state) => ({
      currentAnswers: state.currentAnswers.map((answer) =>
        answer.id === answerId ? { ...answer, ...data } : answer
      )
    }));
  },

  resetWhitelist: () => {
    set({
      currentWhitelist: null,
      currentAnswers: []
    });
  }
}));
