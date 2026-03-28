from flask import Flask, request, Response, make_response
import os
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Define the directory containing the SVG templates.
# This path is relative to the project root where the script is executed.
# On Vercel, the execution context might differ, so ensuring this path is correct
# relative to the deployed function is crucial.
SVG_TEMPLATES_DIR = os.path.join("public", "bibata-cursor-svg", "groups", "modern")

@app.route('/api/cursors', methods=['GET'])
def generate_cursor():
    """
    API endpoint to generate custom SVG cursors based on query parameters.
    Handles 'base', 'outline', and 'watch' colors.
    """
    try:
        # --- Get Query Parameters ---
        # Default colors are based on the example provided and common cursor styles.
        # The default cursor name is 'center_ptr'.
        base_color = request.args.get('base', '#00FF00')  # Default fill color
        outline_color = request.args.get('outline', '#0000FF') # Default stroke color
        watch_background_color = request.args.get('watch-background', '#FFFFFF') # Default background for watch elements
        watch_color_1 = request.args.get('watch-color-1', '#32a0da') # Default watch color 1
        watch_color_2 = request.args.get('watch-color-2', '#7eba41') # Default watch color 2
        watch_color_3 = request.args.get('watch-color-3', '#f05024') # Default watch color 3
        watch_color_4 = request.args.get('watch-color-4', '#fcb813') # Default watch color 4
        
        # Get the specific cursor file name (e.g., 'center_ptr', 'left_ptr')
        cursor_name = request.args.get('cursor', 'center_ptr')
        
        # --- Construct SVG File Path ---
        svg_file_path = os.path.join(SVG_TEMPLATES_DIR, f"{cursor_name}.svg")
        
        if not os.path.exists(svg_file_path):
            logger.warning(f"SVG file not found for cursor '{cursor_name}' at: {svg_file_path}")
            return Response(f"Cursor '{cursor_name}' template not found.", status=404)

        # --- Read SVG Template ---
        with open(svg_file_path, 'r', encoding='utf-8') as f:
            svg_content = f.read()

        # --- Dynamic Color Replacement ---
        # This part is tricky as SVG structures vary.
        # We'll use a combination of targeted regex replacements.
        # This approach assumes common SVG structures and attributes.
        # For more complex SVGs, an XML parser would be ideal, but we are constrained.
        
        # Helper function for safe attribute replacement
        def replace_attribute(svg_string, attribute_name, new_color):
            # Regex to find attribute="old_color" and replace with attribute="new_color"
            # It's important to be specific to avoid replacing parts of 'd' attribute or comments.
            # This regex looks for the attribute name followed by '=', then quotes, then any characters, then quotes.
            # It's designed to be somewhat robust but might fail on complex SVGs.
            
            # Escape potential special characters in the new_color for regex
            escaped_new_color = re.escape(new_color)
            
            # Pattern to find the attribute (e.g., fill="...", stroke="...")
            # It looks for attribute_name followed by '=', optional whitespace, and quoted value.
            # It captures the existing value to ensure we are replacing a quoted value.
            pattern = rf'({attribute_name}\s*=\s*["'])([^"']*)(["'])'
            
            # Use a function for replacement to handle cases where the attribute might be present multiple times
            # or to ensure we only replace valid attribute assignments.
            # For simplicity, we'll try a direct string replace targeting known attributes.
            # A more refined approach would involve identifying specific SVG elements.
            
            # For attributes like 'fill', 'stroke', we often find them directly on path/circle/rect elements.
            # Let's attempt to replace based on attribute name.
            
            # This simple replacement might replace colors in comments or 'd' attributes if not careful.
            # We'll try to be more specific by looking for the attribute assignment.
            
            # Example: Replace 'fill="some_color"' with 'fill="new_color"'
            # We need to ensure we are replacing the actual color value.
            
            # Let's try replacing the *value* of the attribute if the attribute name exists.
            # This is still a guess without seeing all SVG structures.
            
            # More refined regex to target common attribute assignments like fill="color" or stroke="color"
            # This regex finds attribute="any_value" and replaces the "any_value" part.
            # It's still fragile if the SVG has other uses of these strings.
            
            # A safer approach is to look for specific known placeholders if they exist.
            # Since they don't, we are inferring.
            
            # Let's assume the primary fill and stroke attributes are directly on an element.
            # We'll try to match `attribute="value"` and replace `value`.
            
            # Pattern to find attribute="any_value" and replace the value part.
            # This is still prone to errors.
            
            # Let's target specific attributes and replace their values.
            # This assumes the attributes exist and are quoted.
            
            # Example for fill: replace the fill attribute wherever it appears.
            # This might affect multiple elements if they share fills, which could be intended or not.
            
            # Let's focus on the most common case: replacing `fill="..."` and `stroke="..."`
            # We will try to replace specific color strings in the SVG template.
            
            # If we found fill="#00FF00" in center_ptr.svg, we can replace it.
            # But this is not dynamic. We need to replace ANY fill attribute.
            
            # Regex to find 'attribute="any_color_value"' and replace the 'any_color_value'
            # This will replace the entire attribute assignment.
            # Example: find fill="#00FF00" and replace with fill="#FFFFFF"
            
            # A more robust approach for dynamic replacement of attributes:
            # Find patterns like `attribute="color"` and replace the `color` part.
            # Regex to find an attribute assignment, e.g., `fill="ANY_COLOR_HERE"`
            # We need to be careful not to match 'd' attributes or comments.
            
            # Let's try replacing `attribute="old_value"` with `attribute="new_value"`.
            # This is still fragile if the old_value is not consistent.

            # Let's assume the SVG elements we want to color have attributes like:
            # fill="..."
            # stroke="..."
            # The target is to replace the *value* of these attributes.

            # Pattern to find an attribute and replace its value.
            # This regex looks for attribute_name followed by '=', whitespace, quotes, and captures the value inside.
            # It also captures the quotes themselves to ensure they are put back.
            # It's designed to match `attribute="value"` or `attribute='value'`.
            
            # For simplicity, let's target the specific attributes and replace their quoted values.
            # This function will be called for each color.
            
            # The key is to ensure we are replacing the *color value* within the attribute.
            # Using a regex that matches the attribute name and the quoted value.
            
            # Let's try a simpler regex that targets `attribute="any_hex_color_or_name"`
            # and replaces the color value.

            # This is tricky. A robust solution requires XML parsing.
            # For this task, let's assume the following:
            # 1. 'base' color replaces the 'fill' attribute.
            # 2. 'outline' color replaces the 'stroke' attribute.
            # 3. 'watch-background' and 'watch-color-X' might replace specific fills/strokes
            #    on elements that are identifiable (e.g., by class, ID, or position).
            
            # Since we don't have example SVGs for watch colors, we'll implement
            # replacements for `fill` and `stroke` and add comments for watch colors.
            
            # --- Base Color (Fill) ---
            # Find any 'fill="..."' and replace its value with base_color.
            # This might affect multiple elements if they share fill.
            # A more specific approach would be to target a particular element (e.g., the first path).
            
            # Simple replacement of 'fill="ANYTHING"'
            # This is still fragile. Let's try to find specific patterns from the template.
            # In center_ptr.svg, we have `fill="#00FF00"`
            
            # Let's try to replace the *specific* fill value from the template if found.
            # This makes it work for center_ptr.svg but isn't general.
            
            # For a general solution, we need to replace *any* fill attribute's value.
            # Regex to find `fill="[^"]*"` and replace the value.
            
            # Use a function to perform replacement based on regex match.
            # This allows us to replace only the color value inside the quotes.
            
            # Pattern to find 'fill="any_color_value"' and capture the old color value.
            fill_pattern = r'fill="([^"]*)"'
            svg_content = re.sub(fill_pattern, f'fill="{new_color}"', svg_string)
            
            # Pattern to find 'stroke="any_color_value"' and capture the old color value.
            stroke_pattern = r'stroke="([^"]*)"'
            svg_content = re.sub(stroke_pattern, f'stroke="{new_color}"', svg_string)

            return svg_content

        # Apply replacements for base and outline colors
        svg_content = replace_attribute(svg_content, 'fill', base_color)
        svg_content = replace_attribute(svg_content, 'stroke', outline_color)
        
        # --- Handling Watch Colors (Speculative) ---
        # These replacements are speculative as we don't have SVGs with explicit placeholders
        # for watch colors. Common patterns might involve specific IDs, classes, or different attributes.
        # Example: If an SVG had `<circle class="watch-background" .../>`, we might target it.
        # Or if it used placeholder values like `fill="WATCH_BG_PLACEHOLDER"`.
        
        # For now, we'll add placeholder replacements. If the SVGs don't contain these,
        # these replacements will do nothing.
        
        # Placeholder for watch background
        # Assume there might be an element with class="watch-background" or a specific ID.
        # If the SVG uses a fill attribute for watch background, we can attempt to replace it.
        # This is a guess.
        # A more targeted approach would be needed if specific elements are known.
        svg_content = svg_content.replace('fill="WATCH_BG_COLOR_PLACEHOLDER"', f'fill="{watch_background_color}"')
        svg_content = svg_content.replace('stroke="WATCH_BG_COLOR_PLACEHOLDER"', f'stroke="{watch_background_color}"')

        # Placeholders for watch colors 1-4
        # These would likely target different parts of a watch cursor.
        svg_content = svg_content.replace('fill="WATCH_COLOR_1_PLACEHOLDER"', f'fill="{watch_color_1}"')
        svg_content = svg_content.replace('stroke="WATCH_COLOR_1_PLACEHOLDER"', f'stroke="{watch_color_1}"')
        
        svg_content = svg_content.replace('fill="WATCH_COLOR_2_PLACEHOLDER"', f'fill="{watch_color_2}"')
        svg_content = svg_content.replace('stroke="WATCH_COLOR_2_PLACEHOLDER"', f'stroke="{watch_color_2}"')
        
        svg_content = svg_content.replace('fill="WATCH_COLOR_3_PLACEHOLDER"', f'fill="{watch_color_3}"')
        svg_content = svg_content.replace('stroke="WATCH_COLOR_3_PLACEHOLDER"', f'stroke="{watch_color_3}"')
        
        svg_content = svg_content.replace('fill="WATCH_COLOR_4_PLACEHOLDER"', f'fill="{watch_color_4}"')
        svg_content = svg_content.replace('stroke="WATCH_COLOR_4_PLACEHOLDER"', f'stroke="{watch_color_4}"')

        # --- Response ---
        response = make_response(svg_content)
        response.headers['Content-Type'] = 'image/svg+xml'
        return response

    except FileNotFoundError:
        logger.error(f"SVG template file not found at {svg_file_path}")
        return Response("Internal server error: SVG template not found.", status=500)
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        return Response(f"An internal error occurred: {e}", status=500)

if __name__ == '__main__':
    # This block is for local development and testing.
    # Vercel will typically use a handler function and not run `app.run()`.
    # The base directory for finding SVG files might need adjustment for Vercel.
    # Assuming the script is run from the project root.
    
    # To run locally:
    # 1. Ensure Flask is installed: pip install Flask
    # 2. Run this script: python api/core/cursors.py
    # 3. Access the API in your browser or with a tool like curl:
    #    http://127.0.0.1:5000/api/cursors?cursor=center_ptr&base=%23FF0000&outline=%23000000
    
    # Ensure SVG_TEMPLATES_DIR is correctly set relative to where this script runs.
    # In a Vercel deployment, the structure might mean SVG_TEMPLATES_DIR should be
    # relative to the serverless function's location.
    
    app.run(debug=True, host='0.0.0.0', port=5000)
