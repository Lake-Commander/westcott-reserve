#!/usr/bin/env bash
# ==============================================================================
# Script: fix_theme_scope.sh
# Purpose: Removes out-of-scope theme references from static StyleSheet.create
# ==============================================================================

TARGET_DIR="${1:-./screens}"

echo "Cleaning out-of-scope 'theme' properties from StyleSheet blocks..."

find "$TARGET_DIR" -maxdepth 2 -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    if [[ "$file" == *"ScreenWrapper"* ]]; then continue; fi

    # Check if file has theme references inside StyleSheet
    if grep -q "theme\." "$file"; then
        echo " Fixing: $file"
        
        # Remove lines containing theme. inside StyleSheet.create blocks
        awk '
            /StyleSheet\.create/ { in_stylesheet=1 }
            in_stylesheet && /backgroundColor:[[:space:]]*theme\./ { next }
            in_stylesheet && /borderColor:[[:space:]]*theme\./ { next }
            in_stylesheet && /borderBottomColor:[[:space:]]*theme\./ { next }
            in_stylesheet && /color:[[:space:]]*theme\./ { next }
            { print }
        ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
done

echo "Done! Restart your Metro bundler."
