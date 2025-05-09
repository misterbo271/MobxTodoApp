import { types, flow, onSnapshot, getSnapshot } from 'mobx-state-tree';
import { Todo } from './Todo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'MOBX_TODO_APP_DATA';

export const RootStore = types
  .model('RootStore', {
    todos: types.array(Todo),
    isLoading: types.optional(types.boolean, false),
  })
  .views((self) => ({
    get completedCount() {
      return self.todos.filter(todo => todo.done).length;
    },
    get remainingCount() {
      return self.todos.length - self.completedCount;
    }
  }))
  .actions((self) => {

    const afterCreate = () => {
      self.loadTodos();
    };

    return {
      afterCreate,
      addTodo(title) {
        const id = Date.now().toString();
        self.todos.push({ id, title, done: false });
        self.saveTodos();
      },

      deleteTodo(id) {
        const index = self.todos.findIndex(todo => todo.id === id);
        if (index !== -1) {
          self.todos.splice(index, 1);
          self.saveTodos();
        }
      },

      saveTodos: flow(function* saveTodos() {
        try {
          const todosData = JSON.stringify(getSnapshot(self.todos));
          yield AsyncStorage.setItem(STORAGE_KEY, todosData);
        } catch (error) {
          console.error('Error saving todos:', error);
        }
      }),

      loadTodos: flow(function* loadTodos() {
        self.isLoading = true;
        try {
          const data = yield AsyncStorage.getItem(STORAGE_KEY);
          if (data) {
            const todosData = JSON.parse(data);
            self.todos.replace(todosData);
          }
        } catch (error) {
          console.error('Error loading todos:', error);
        } finally {
          self.isLoading = false;
        }
      }),
    };
  });

export const createRootStore = () => {
  const store = RootStore.create({
    todos: [],
  });

  onSnapshot(store, () => {
    if (!store.isLoading) {
      // store.saveTodos();
    }
  });

  return store;
};

export const rootStore = createRootStore();
