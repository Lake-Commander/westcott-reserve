#!/usr/bin/env bash
# ==============================================================================
# Script: fix_theme_cards.sh
# Purpose: Replace hardcoded dark card backgrounds/borders across screen files
# Usage: ./fix_theme_cards.sh [path_to_screens]
# ==============================================================================

TARGET_DIR="${1:-./screens}"

echo "Replacing hardcoded card and container colors in: $TARGET_DIR"

# Array of hardcoded dark backgrounds to map to theme.cardBg / theme.inputBg
DARK_CARD_BG=('"#16161D"' '"#16161A"' '"#141A18"' '"#15151A"' '"#1C1C24"' '"#18181E"')
# Array of hardcoded dark borders to map to theme.cardBorder
DARK_BORDERS=('"#22222A"' '"#1E2925"' '"#24242C"' '"#202028"' '"#262632"' '"#1E1E26"' '"#3D2A14"')

find "$TARGET_DIR" -maxdepth 2 -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    if [[ "$file" == *"ScreenWrapper"* ]]; then continue; fi
    
    echo "Processing $file..."

    # Ensure useAppTheme is imported
    if ! grep -q "useAppTheme" "$file"; then
        awk '/import React/ { print $0; print "import { useAppTheme } from \x27../hooks/useAppTheme\x27;"; next } { print }' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi

    # Ensure theme destructuring exists inside component body
    if ! grep -q "const { theme" "$file"; then
        awk '/const [A-Za-z0-9_]+ = \(\{/ { print $0; print "  const { theme, isDark } = useAppTheme();"; next } { print }' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi

    # Replace hardcoded card backgrounds with dynamic inline theme.cardBg
    for bg in "${DARK_CARD_BG[@]}"; do
        sed -i "s/backgroundColor: ${bg}/backgroundColor: theme.cardBg/g" "$file"
    done

    # Replace hardcoded borders with dynamic inline theme.cardBorder
    for border in "${DARK_BORDERS[@]}"; do
        sed -i "s/borderColor: ${border}/borderColor: theme.cardBorder/g" "$file"
        sed -i "s/borderBottomColor: ${border}/borderBottomColor: theme.cardBorder/g" "$file"
    done
done

echo "Refactoring completed!"
