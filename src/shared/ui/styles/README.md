# Shared Styles System

This directory contains shared style modules used across the application to ensure consistency and maintainability. These styles are built upon the theme system defined in `src/shared/ui/theme`.

## Usage

To use shared styles in your component, use the `useAppStyles` hook:

```tsx
import React from 'react';
import {View, Text, TextInput} from 'react-native';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';

const MyComponent = () => {
  const {screen, form, text, theme} = useAppStyles();

  return (
    <View style={screen.container}>
      <Text style={text.pageTitle}>My Page</Text>
      
      <View style={form.section}>
        <Text style={form.label}>Input Label</Text>
        <TextInput 
          style={form.input}
          placeholder="Type here..."
          placeholderTextColor={theme.colors.text.secondary}
        />
      </View>
    </View>
  );
};
```

## Available Modules

- **screenStyles**: Common screen layouts (container, safeArea, header, content, footer)
- **formStyles**: Form elements (sections, labels, inputs, buttons)
- **modalStyles**: Modal layouts (overlay, container, header, content, footer)
- **cardStyles**: Card variations (base, mediaCard, questionCard)
- **listStyles**: List item styles (container, item, itemSelected, separator)
- **textStyles**: Common typography styles (pageTitle, sectionTitle, bodyText, caption, link)

## Component-Specific Styles

For styles that are specific to a single component and not reusable, create a local style object using `createStyles` and access it via `useStyles`:

```tsx
import {createStyles, useStyles} from '../../shared/ui/theme';

const MyComponent = () => {
  const styles = useStyles(themeStyles);
  
  return (
    <View style={styles.customContainer}>
      {/* ... */}
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  customContainer: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    // Custom styles here
  },
}));
```

## Best Practices

1. **Prefer Shared Styles**: Always check if a shared style exists before creating a custom one.
2. **Use Theme Tokens**: Never hardcode colors, spacing, or font sizes. Always use `theme.colors`, `theme.spacing`, etc.
3. **Avoid Inline Styles**: Do not use `style={{ padding: 10 }}`. Create a style object or use a utility style.
4. **Dark Mode Support**: By using theme tokens, your component will automatically support dark mode when we implement it (theme structure already supports it).
