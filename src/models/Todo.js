import { types, getParent } from 'mobx-state-tree';

export const Todo = types
  .model("Todo", {
    id: types.string,
    title: types.string,
    done: types.boolean,
  })
  .actions((self) => ({
    toggle() {
      self.done = !self.done;
      // Get parent store and save todos after toggle
      getParent(self, 2).saveTodos();
    },
  }));
