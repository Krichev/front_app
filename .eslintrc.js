module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'no-restricted-syntax': [
        'warn',
        {
            selector: "Property[key.name='backgroundColor'][value.value=/^#/]",
            message: 'Use theme.colors.* instead of hardcoded colors',
        },
        {
            selector: "Property[key.name='color'][value.value=/^#/]",
            message: 'Use theme.colors.* instead of hardcoded colors',
        },
    ],
  },
};