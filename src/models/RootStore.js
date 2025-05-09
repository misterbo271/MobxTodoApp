import { types } from 'mobx-state-tree';
import { Todo } from './Todo';

export const RootStore = types
  .model('RootStore', {
    todos: types.array(Todo),
  })
  .actions((self) => ({
    addTodo(title) {
      self.todos.push({ id: self.todos.length + 1, title, done: false });
    },
  }));

export const createRootStore = () => {
  return RootStore.create({
    todos: [],
  });
};

export const rootStore = createRootStore();
