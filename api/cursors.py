import os
import re
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the directory containing the SVG templates.
# This path needs to be relative to the execution context of the serverless function.
# Assuming the function is deployed at the root of the 'api' directory,
# and 'public' is at the project root.
SVG_TEMPLATES_DIR = os.path.join("public", "bibata-cursor-svg", "groups", "modern")

def handler(event, context):
    """
    Vercel serverless function handler to generate custom SVG cursors.
    Handles 'base', 'outline', and 'watch' colors based on query parameters.
    """
    try:
        # --- Get Query Parameters ---
        query_params = event.get('queryStringParameters', {}) or {} # Ensure it's a dict

        base_color = query_params.get('base', '#00FF00')  # Default fill color from center_ptr.svg
        outline_color = query_params.get('outline', '#0000FF') # Default stroke color from center_ptr.svg
        
        # Watch colors - these are speculative and depend on SVG structure.
        # For now, we use placeholders that would need to be present in the SVGs.
        watch_background_color = query_params.get('watch-background', '#FFFFFF')
        watch_color_1 = query_params.get('watch-color-1', '#32a0da')
        watch_color_2 = query_params.get('watch-color-2', '#7eba41')
        watch_color_3 = query_params.get('watch-color-3', '#f05024')
        watch_color_4 = query_params.get('watch-color-4', '#fcb813')
        
        cursor_name = query_params.get('cursor', 'center_ptr')
        
        # --- Construct SVG File Path ---
        svg_file_path = os.path.join(SVG_TEMPLATES_DIR, f"{cursor_name}.svg")
        
        if not os.path.exists(svg_file_path):
            logger.warning(f"SVG file not found for cursor '{cursor_name}' at: {svg_file_path}")
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': f"Cursor '{cursor_name}' template not found."})
            }

        # --- Read SVG Template ---
        with open(svg_file_path, 'r', encoding='utf-8') as f:
            svg_content = f.read()

        # --- Dynamic Color Replacement ---
        # This is a simplified approach using regex for attribute replacement.
        # It might need refinement for complex SVGs or different attribute structures.

        def replace_color_attribute(svg_string, attribute_name, new_color):
            # Regex to find 'attribute="any_color_value"' and replace the value part.
            # This aims to be somewhat specific to attribute assignments.
            # It looks for the attribute name, followed by '=', optional whitespace, and a quoted value.
            # It captures the quotes to reconstruct the attribute.
            # Note: This is still fragile and might not handle all SVG variations (e.g., single quotes, no quotes, complex values).
            
            # Pattern to find the attribute assignment and capture its current value.
            # We escape the attribute name in case it contains regex special characters.
            # The pattern looks for attribute_name= followed by a quoted string.
            # Example: fill="some_color" or stroke='another_color'
            pattern = rf'({re.escape(attribute_name)}\s*=\s*["'])([^"']*)(["'])'
            
            # Replace the matched attribute value with the new color.
            # This uses a lambda function to ensure we put back the quotes correctly.
            # It replaces the entire matched group (attribute=value) with the new attribute=new_color.
            # We need to replace the whole attribute assignment for robustness.
            
            # Let's try a simpler, more direct replacement that targets `attribute="value"`
            # and replaces the *entire* attribute assignment.
            # This assumes the attribute exists and we want to set it to the new color.
            
            # Pattern to find attribute="ANYTHING" and replace the entire attribute assignment.
            # This is still not perfect, as it might match unintended attributes if names are similar.
            
            # A more robust way is to find the attribute and replace its value.
            # Let's use a function for replacement that targets the value.
            
            # Regex to find `attribute="ANY_COLOR_VALUE"` and replace the `ANY_COLOR_VALUE` part.
            # It looks for the attribute name, '=', quotes, captures the value inside, and the closing quote.
            # This is still basic and might need adjustment based on actual SVG content.
            
            # Try to match attribute="value" and replace the value part.
            # This regex aims to match `attribute="value"` or `attribute='value'`.
            # It captures the quote character to ensure it's preserved.
            regex_pattern = rf'({re.escape(attribute_name)}\s*=\s*)(["'])(.*?)(["'])'
            
            # Function to perform the replacement
            def replacer(match):
                attribute_prefix = match.group(1) # e.g., 'fill=' or 'stroke='
                quote = match.group(2)           # The opening quote (", ')
                # original_value = match.group(3) # The original color value (not used here)
                closing_quote = match.group(4)   # The closing quote (", ')
                
                # Construct the new attribute assignment.
                return f'{attribute_prefix}{quote}{new_color}{closing_quote}'

            # Apply the replacement. This will replace all occurrences of the pattern.
            # This is still a simplification. A more advanced solution would parse XML.
            return re.sub(regex_pattern, replacer, svg_string, flags=re.IGNORECASE)

        # Apply replacements for base and outline colors
        # The `replace_color_attribute` function targets generic attribute assignments like fill="..."
        svg_content = replace_color_attribute(svg_content, 'fill', base_color)
        svg_content = replace_color_attribute(svg_content, 'stroke', outline_color)
        
        # --- Handling Watch Colors (Speculative) ---
        # These replacements are speculative and depend on the SVG templates having specific placeholders.
        # If SVGs use e.g., fill="WATCH_BG_COLOR_PLACEHOLDER", these will work.
        # Otherwise, they will do nothing.

        # Placeholder for watch background
        svg_content = svg_content.replace('fill="WATCH_BG_COLOR_PLACEHOLDER"', f'fill="{watch_background_color}"')
        svg_content = svg_content.replace('stroke="WATCH_BG_COLOR_PLACEHOLDER"', f'stroke="{watch_background_color}"')

        # Placeholders for watch colors 1-4
        svg_content = svg_content.replace('fill="WATCH_COLOR_1_PLACEHOLDER"', f'fill="{watch_color_1}"')
        svg_content = svg_content.replace('stroke="WATCH_COLOR_1_PLACEHOLDER"', f'stroke="{watch_color_1}"')
        
        svg_content = svg_content.replace('fill="WATCH_COLOR_2_PLACEHOLDER"', f'fill="{watch_color_2}"')
        svg_content = svg_content.replace('stroke="WATCH_COLOR_2_PLACEHOLDER"', f'stroke="{watch_color_2}"')
        
        svg_content = svg_content.replace('fill="WATCH_COLOR_3_PLACEHOLDER"', f'fill="{watch_color_3}"')
        svg_content = svg_content.replace('stroke="WATCH_COLOR_3_PLACEHOLDER"', f'stroke="{watch_color_3}"')
        
        svg_content = svg_content.replace('fill="WATCH_COLOR_4_PLACEHOLDER"', f'fill="{watch_color_4}"')
        svg_content = svg_content.replace('stroke="WATCH_COLOR_4_PLACEHOLDER"', f'stroke="{watch_color_4}"')

        # --- Vercel Serverless Function Response Format ---
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'image/svg+xml',
                # Optional: Cache control headers for better performance
                'Cache-Control': 'public, max-age=31536000, immutable'
            },
            'body': svg_content
        }

    except FileNotFoundError:
        logger.error(f"SVG template file not found at {svg_file_path}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error: SVG template not found.'})
        }
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'An internal server error occurred: {str(e)}'})
        }

# Note: When deploying to Vercel, this file (e.g., api/cursors.py) will be automatically
# recognized as a serverless function if placed in the 'api' directory.
# The 'handler' function is the entry point. No need for `if __name__ == '__main__': app.run()`.
