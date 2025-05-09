# MobX and MobX-State-Tree in Todo App

This document provides an overview of how MobX and MobX-State-Tree (MST) are implemented and utilized in this React Native Todo application.

## Project Environment

- **React Native Version**: 0.79.2
- **MobX Version**: 6.13.7
- **MobX-React-Lite Version**: 4.1.0
- **MobX-State-Tree Version**: 7.0.2

## Understanding MobX

MobX is a state management library that makes state management simple and scalable by applying transparent functional reactive programming (TFRP). The core principle behind MobX is:

> _"Anything that can be derived from the application state, should be derived. Automatically."_

### Key Concepts in MobX

1. **Observables**: State variables that can be observed for changes
2. **Actions**: Methods that modify state
3. **Computed Values**: Values derived from the state automatically
4. **Reactions**: Side effects that run automatically when observed data changes

### How MobX Works

MobX turns your data into observable objects. When these observable objects change, MobX tracks these changes and automatically updates any part of your application that depends on this data.

## Understanding MobX-State-Tree (MST)

MobX-State-Tree is built on top of MobX. It combines the simplicity and ease of mutable data with the traceability of immutable data and the reactiveness and performance of observable data.

### Key Features of MST

1. **Type System**: Runtime type checking ensures your state has the expected structure
2. **Composable**: Models can be composed and nested to create complex state trees
3. **Snapshots**: Easily create serializable snapshots of state
4. **Patches**: Track all changes to state as JSON patches
5. **Actions**: Enforce that state modifications only happen through actions
6. **Middleware**: Hook into actions, state changes and more

## Implementation in This Project

### Model Structure

The project uses a simple but effective model structure:

#### 1. Todo Model (`src/models/Todo.js`)

```javascript
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
```

This model represents a single todo item with:
- Properties: `id` (string), `title`, and `done` status
- Actions: `toggle()` to change the completion status
- Parent communication: Uses `getParent()` to access the root store and trigger data persistence

#### 2. RootStore (`src/models/RootStore.js`)

```javascript
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
```

The RootStore:
- Composes the Todo model in an array
- Provides lifecycle hooks via `afterCreate`
- Handles data persistence with AsyncStorage
- Includes computed views for completed and remaining counts
- Provides actions for adding, deleting, saving and loading todos
- Uses flow generators for handling async operations

### Store Context Setup

To make the store available throughout the application, a React Context is used:

#### Store Context (`src/stores/RootStoreContext.js`)

```javascript
import React, { createContext, useContext } from 'react';
import { rootStore } from '../models/RootStore';

const RootStoreContext = createContext(rootStore);

export const RootStoreProvider = ({ children }) => (
  <RootStoreContext.Provider value={rootStore}>
    {children}
  </RootStoreContext.Provider>
);

export const useRootStore = () => useContext(RootStoreContext);
```

This provides:
- A central context holding the rootStore
- A provider component to wrap the application
- A custom hook to access the store from any component

### Integration with React Native Components

#### App Component (`src/App.js`)

```javascript
import React from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { RootStoreProvider } from './stores/RootStoreContext';

const App = () => {
  return (
    <RootStoreProvider>
      <HomeScreen />
    </RootStoreProvider>
  );
};

export default App;
```

The App component simply wraps the HomeScreen with the RootStoreProvider, making the store available.

#### HomeScreen Component (`src/screens/HomeScreen.js`)

```javascript
// Separate observer component for optimal reactivity
const TodoItem = observer(({ item, onToggle, onDelete }) => {
  return (
    <TouchableOpacity 
      onPress={onToggle}
      style={styles.todoItem}
    >
      <View style={styles.todoContent}>
        <View style={styles.checkboxContainer}>
          {item.done ? (
            <Icon name="check-box" size={24} color="#4287f5" />
          ) : (
            <Icon name="check-box-outline-blank" size={24} color="#4287f5" />
          )}
        </View>
        <Text style={[styles.todoTitle, item.done && styles.todoTitleDone]}>
          {item.title}
        </Text>
        {item.done && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Icon name="delete" size={22} color="#ff6b6b" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

export const HomeScreen = observer(() => {
  const [text, setText] = useState('');
  const { todos, addTodo, deleteTodo, isLoading } = rootStore;
  const [refresh, setRefresh] = useState(false);

  // Load todos on component mount
  useEffect(() => {
    rootStore.loadTodos();
  }, []);

  const handleToggle = (item) => {
    item.toggle();
    setRefresh(!refresh);
  };

  // Render loading state or todo list
  // ...
});
```

Key points:
- Separate `TodoItem` component for better reactivity and rendering optimization
- Force re-rendering with the `refresh` state and `extraData` prop for the FlatList
- Loading state handling with `ActivityIndicator` during data loading
- Direct destructuring of store methods and properties
- Deletion functionality for completed todos

## Data Persistence

This application implements data persistence using AsyncStorage:

1. **Storage Key**: A constant `STORAGE_KEY` is used to store and retrieve data
2. **Auto-Loading**: Data is loaded automatically when the store is created via the `afterCreate` lifecycle hook
3. **On-Change Saving**: Data is saved whenever a todo is added, toggled, or deleted
4. **Snapshots**: The MST `getSnapshot` function is used to serialize the state tree
5. **Error Handling**: Try/catch blocks around async operations ensure robust data handling

## Benefits of MST in this Project

1. **Type Safety**: Runtime type checking ensures data integrity
2. **Self-Contained Logic**: Actions are defined alongside data
3. **Simple API**: Observable state that auto-updates the UI
4. **Predictable State Changes**: State can only be modified through actions
5. **Performance**: Selective re-rendering only when needed
6. **Persistence**: Seamless integration with AsyncStorage for data persistence

## How Reactivity Works in this App

1. The Todo array in RootStore is an observable collection
2. When a new Todo is added via `addTodo()`, MST tracks this change
3. The HomeScreen component observes this data via the `observer` wrapper
4. React automatically re-renders the FlatList when the todos array changes
5. The TodoItem component is an observer itself, so it only re-renders when its specific props change
6. When `toggle()` is called on a Todo, the UI updates to reflect the new state
7. For completed todos, a delete button appears, allowing the user to remove the item

## MST Features Used in This Project

1. **Models**: Structured data with the `types.model()` function
2. **Actions**: Methods that modify state with the `.actions()` function
3. **Views**: Computed values with the `.views()` function
4. **Flow Generators**: Async actions with the `flow()` function
5. **Lifecycles**: React to model creation with `afterCreate`
6. **Snapshots**: Serialize state with `getSnapshot()`
7. **Observers**: React components that react to state changes with `observer()`
8. **Parent References**: Access parent models with `getParent()`

## Best Practices Used

1. **Single Source of Truth**: All data is in the MST store
2. **Immutable View, Mutable Changes**: Data updates appear immutable to the view, but are made with simple mutations
3. **Contained Logic**: Business logic (toggling, adding) is contained in the models
4. **Component Decoupling**: UI components don't need to know the details of state management
5. **React Context Integration**: Proper use of Context API to avoid prop drilling
6. **Data Persistence**: Automatic saving and loading of data for offline use
7. **Optimized Rendering**: Using separate observer components to minimize re-renders

## Advanced MST Features Not Used (But Available)

This project demonstrates a basic implementation. MST offers many more advanced features not utilized here:

1. **Advanced Views**: More complex computed values with arguments or memoization
2. **Middleware**: Intercept actions, state changes for logging or debugging
3. **References**: Create references between models with `types.reference`
4. **Identifiers**: More advanced use of `types.identifier` for model relationships
5. **Patches**: For time-travel debugging and undo/redo functionality
6. **Volatile State**: For transient UI state that doesn't need to be serialized
7. **Custom Types**: Create your own types with custom validation logic

## Conclusion

This Todo application demonstrates a clean implementation of MobX-State-Tree in a React Native application. It shows how MST makes state management simple, type-safe, and performant even in a small application. The addition of data persistence with AsyncStorage enhances the user experience by preserving todos between app sessions. The same patterns shown here can be scaled to larger, more complex applications with minimal additional complexity.

## References

- [MobX Official Documentation](https://mobx.js.org/) - The official MobX documentation provides comprehensive guides, API references, and examples for using MobX in your applications.

- [MobX-State-Tree Documentation](https://mobx-state-tree.js.org/) - The official MST documentation contains detailed guides, tutorials, and API references for building robust state management with MobX-State-Tree.

