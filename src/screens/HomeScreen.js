import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../models/RootStore';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
        <Text style={[
          styles.todoTitle,
          item.done && styles.todoTitleDone
        ]}>
          {item.title}
        </Text>
        {item.done && (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
          >
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
  const [refresh, setRefresh] = useState(false); // Add state for forcing re-render

  useEffect(() => {
    rootStore.loadTodos();
  }, []);

  const handleToggle = (item) => {
    item.toggle();
    setRefresh(!refresh);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4287f5" />
        <Text style={styles.loadingText}>Loading your todos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4287f5" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Todo List</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter a new task..."
          placeholderTextColor="#56a8db"
          value={text}
          onChangeText={setText}
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (text.trim()) {
              addTodo(text.trim());
              setText("");
            }
          }}
        >
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos.slice()}
        extraData={refresh}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TodoItem
            item={item}
            onToggle={() => handleToggle(item)}
            onDelete={() => deleteTodo(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet. Add one above!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6eefc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4287f5',
  },
  header: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#4287f5',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#4287f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  todoItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  checkboxContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoTitle: {
    fontSize: 17,
    color: '#333',
    flex: 1,
  },
  todoTitleDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    padding: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#56a8db',
    textAlign: 'center',
  },
});
