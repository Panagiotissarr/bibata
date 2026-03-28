const FRIENDLY_CURSOR_NAMES: Record<string, string> = {
  left_ptr: 'Pointer',
  left_ptr_watch: 'Working',
  hand1: 'Hand',
  hand2: 'Link Hand',
  xterm: 'Text',
  wait: 'Busy',
  crosshair: 'Crosshair',
  move: 'Move',
  grabbing: 'Grabbing',
  copy: 'Copy',
  link: 'Link',
  'dnd-copy': 'Copy Drop',
  'dnd-link': 'Link Drop',
  dnd_no_drop: 'No Drop',
  'dnd-ask': 'Ask',
  plus: 'Add',
  pencil: 'Pencil',
  'zoom-in': 'Zoom In',
  'zoom-out': 'Zoom Out',
  'vertical-text': 'Vertical Text',
  right_ptr: 'Alternate Pointer',
  'context-menu': 'Context Menu',
  circle: 'Unavailable',
  cross: 'Cross',
  tcross: 'Precision Select',
  'pointer-move': 'Pointer Move',
  person: 'Person',
  pin: 'Pin',
  dotbox: 'Box Select',
  center_ptr: 'Center Pointer',
  question_arrow: 'Help',
  crossed_circle: 'Not Allowed',
  bd_double_arrow: 'Diagonal Resize',
  fd_double_arrow: 'Reverse Diagonal Resize',
  bottom_left_corner: 'Bottom Left Resize',
  bottom_right_corner: 'Bottom Right Resize',
  bottom_side: 'Bottom Resize',
  bottom_tee: 'Bottom Tee',
  left_side: 'Left Resize',
  left_tee: 'Left Tee',
  right_side: 'Right Resize',
  right_tee: 'Right Tee',
  top_left_corner: 'Top Left Resize',
  top_right_corner: 'Top Right Resize',
  top_side: 'Top Resize',
  top_tee: 'Top Tee',
  sb_down_arrow: 'Scroll Down',
  sb_left_arrow: 'Scroll Left',
  sb_right_arrow: 'Scroll Right',
  sb_up_arrow: 'Scroll Up',
  sb_h_double_arrow: 'Horizontal Resize',
  sb_v_double_arrow: 'Vertical Resize',
  ll_angle: 'Lower Left Angle',
  lr_angle: 'Lower Right Angle',
  ul_angle: 'Upper Left Angle',
  ur_angle: 'Upper Right Angle',
  'wayland-cursor': 'Wayland Cursor',
  X_cursor: 'X Cursor'
};

const toTitleCase = (value: string) =>
  value.replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getCursorDisplayName = (name: string) => {
  const label = FRIENDLY_CURSOR_NAMES[name];
  if (label) {
    return label;
  }

  return toTitleCase(name.replace(/[-_]/g, ' '));
};

export const getCursorAdvancedName = (name: string) => name;
