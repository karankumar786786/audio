import '@expo/metro-runtime';
import React from 'react';
import { ExpoRoot } from 'expo-router';
import { Head } from 'expo-router/build/head';
import 'expo-router/build/fast-refresh';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

// Require the app directory directly to avoid environment variable inlining issues in monorepos
const ctx = require.context('./app');

export function App() {
  return (
    <Head.Provider>
      <ExpoRoot context={ctx} />
    </Head.Provider>
  );
}

renderRootComponent(App);
