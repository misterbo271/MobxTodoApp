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
```

This model represents a single todo item with:
- Properties: `id`, `title`, and `done` status
- Actions: `toggle()` to change the completion status

#### 2. RootStore (`src/models/RootStore.js`)

```javascript
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
```

The RootStore:
- Composes the Todo model in an array
- Provides an action to add new todo items
- Creates an initial store with an empty todos array

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
import React, { useState } from 'react';
import { /* ...imports */ } from 'react-native';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../models/RootStore';

export const HomeScreen = observer(() => {
  const [text, setText] = useState('');
  const { todos, addTodo } = rootStore;

  // UI implementation...
});
```

Key points:
- The component is wrapped with the `observer` HOC from mobx-react-lite, which automatically re-renders when observed data changes
- It accesses the store directly via the rootStore import
- It destructures todos and addTodo from the store

## Benefits of MST in this Project

1. **Type Safety**: Runtime type checking ensures data integrity
2. **Self-Contained Logic**: Actions are defined alongside data
3. **Simple API**: Observable state that auto-updates the UI
4. **Predictable State Changes**: State can only be modified through actions
5. **Performance**: Selective re-rendering only when needed

## How Reactivity Works in this App

1. The Todo array in RootStore is an observable collection
2. When a new Todo is added via `addTodo()`, MST tracks this change
3. The HomeScreen component observes this data via the `observer` wrapper
4. React automatically re-renders the FlatList when the todos array changes
5. Similarly, when `toggle()` is called on a Todo, only that specific Todo item re-renders

## Best Practices Used

1. **Single Source of Truth**: All data is in the MST store
2. **Immutable View, Mutable Changes**: Data updates appear immutable to the view, but are made with simple mutations
3. **Contained Logic**: Business logic (toggling, adding) is contained in the models
4. **Component Decoupling**: UI components don't need to know the details of state management
5. **React Context Integration**: Proper use of Context API to avoid prop drilling

## Advanced MST Features Not Used (But Available)

This project demonstrates a basic implementation. MST offers many more advanced features not utilized here:

1. **Views (computed)**: Derived values from state
2. **Middleware**: Intercept actions, state changes
3. **References**: Create references between models
4. **Snapshots & Patches**: For time-travel debugging
5. **Lifecycle Hooks**: React to model events
6. **Volatile State**: For transient UI state

## Conclusion

This Todo application demonstrates a clean implementation of MobX-State-Tree in a React Native application. It shows how MST makes state management simple, type-safe, and performant even in a small application. The same patterns shown here can be scaled to larger, more complex applications with minimal additional complexity.

## References

- [MobX Official Documentation](https://mobx.js.org/) - The official MobX documentation provides comprehensive guides, API references, and examples for using MobX in your applications.

- [MobX-State-Tree Documentation](https://mobx-state-tree.js.org/) - The official MST documentation contains detailed guides, tutorials, and API references for building robust state management with MobX-State-Tree.

