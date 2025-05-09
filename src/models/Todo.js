import { types } from 'mobx-state-tree';

export const Todo = types
  .model("Todo", {
    id: types.number,
    title: types.string,
    done: types.boolean,
  })
  .actions((self) => ({
    toggle() {
      self.done = !self.done;
    },
  }));
