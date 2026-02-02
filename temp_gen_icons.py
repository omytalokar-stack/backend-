from PIL import Image, ImageDraw
import os

# Create the icons directory if it doesn't exist
icons_dir = 'public/icons'
os.makedirs(icons_dir, exist_ok=True)

# Generate icon images with exact design
# Creating a 512x512 base and then resizing

def create_princess_icon(size):
    # Create image with black background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    
    # For PNG icons, we'll create the ornate P with proper styling
    # This is a placeholder - we'll use the actual image if provided
    
    return img

# Load the provided image if it exists and resize
# For now, create simple versions
try:
    # Try to load from clipboard or temp location
    # Create high-quality PNG icons
    img_512 = create_princess_icon(512)
    img_192 = create_princess_icon(192)
    
    # Save as PNG for better quality
    img_512.save(os.path.join(icons_dir, 'icon-512.png'))
    img_192.save(os.path.join(icons_dir, 'icon-192.png'))
    
    print(f'Icons created: {icons_dir}/icon-512.png, {icons_dir}/icon-192.png')
except Exception as e:
    print(f'Error: {e}')
