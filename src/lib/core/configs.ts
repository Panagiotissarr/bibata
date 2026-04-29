export type CursorConfig = {
  x?: number;
  y?: number;
  winname?: string;
  xname?: string;
  links?: string[];
};

export const rconfigs: Record<string, CursorConfig> = {
  left_ptr: {
    x: 207,
    y: 24,
    winname: 'Pointer',
    xname: 'left_ptr',
    links: ['arrow', 'default', 'top_left_arrow'],
  },
  left_ptr_watch: {
    x: 197,
    y: 24,
    winname: 'Work',
    xname: 'left_ptr_watch',
    links: [
      '00000000000000020006000e7e9ffc3f',
      '08e8e1c95fe2fc01f976f1e063a24ccd',
      '3ecb610c1bf2410f44200f48c40d3599',
      'progress',
    ],
  },
  right_ptr: {
    x: 55,
    y: 17,
    winname: 'Alternate',
    xname: 'right_ptr',
    links: ['draft_large', 'draft_small'],
  },
  circle: {
    x: 207,
    y: 24,
    winname: 'Unavailable',
    xname: 'circle',
    links: ['forbidden'],
  },
  'context-menu': {
    x: 207,
    y: 24,
    xname: 'context-menu',
  },
  copy: {
    x: 207,
    y: 24,
    xname: 'copy',
    links: [
      '1081e37283d90000800003c07f3ef6bf',
      '6407b0e94181790501fd1e167b474872',
      'b66166c04f8c3109214a4fbd64a50fc8',
    ],
  },
  link: {
    x: 207,
    y: 24,
    xname: 'link',
    links: [
      '3085a0e285430894940527032f8b26df',
      '640fb0e74195791501fd1ed57b41487f',
      'a2a266d0498c3104214a47bd64ab0fc8',
    ],
  },
  'pointer-move': {
    x: 207,
    y: 24,
    xname: 'pointer-move',
  },
  person: {
    x: 207,
    y: 24,
    winname: 'Person',
  },
  pin: {
    x: 207,
    y: 24,
    winname: 'Pin',
  },
};

export const configs: Record<string, CursorConfig> = {
  bd_double_arrow: {
    winname: 'Dgn1',
    xname: 'bd_double_arrow',
    links: ['c7088f0f3e6c8088236ef8e1e3e70000', 'nwse-resize', 'size_fdiag'],
  },
  bottom_left_corner: {
    x: 26,
    y: 232,
    xname: 'bottom_left_corner',
    links: ['sw-resize'],
  },
  bottom_right_corner: {
    x: 229,
    y: 232,
    xname: 'bottom_right_corner',
    links: ['se-resize'],
  },
  bottom_side: {
    x: 129,
    y: 234,
    xname: 'bottom_side',
    links: ['s-resize'],
  },
  bottom_tee: {
    x: 128,
    y: 230,
    xname: 'bottom_tee',
  },
  center_ptr: {
    x: 127,
    y: 17,
    xname: 'center_ptr',
  },
  circle: {
    x: 55,
    y: 17,
    winname: 'Unavailable',
    xname: 'circle',
    links: ['forbidden'],
  },
  'context-menu': {
    x: 57,
    y: 17,
    xname: 'context-menu',
  },
  copy: {
    x: 55,
    y: 17,
    xname: 'copy',
    links: [
      '1081e37283d90000800003c07f3ef6bf',
      '6407b0e94181790501fd1e167b474872',
      'b66166c04f8c3109214a4fbd64a50fc8',
    ],
  },
  cross: {
    xname: 'cross',
    links: ['cross_reverse', 'diamond_cross'],
  },
  crossed_circle: {
    xname: 'crossed_circle',
    links: ['03b6e0fcb3499374a867c041f52298f0', 'not-allowed'],
  },
  crosshair: {
    winname: 'Cross',
    xname: 'crosshair',
  },
  dnd_no_drop: {
    x: 100,
    y: 65,
    xname: 'dnd_no_drop',
    links: ['no-drop'],
  },
  'dnd-ask': {
    x: 100,
    y: 65,
    xname: 'dnd-ask',
  },
  'dnd-copy': {
    x: 100,
    y: 65,
    xname: 'dnd-copy',
  },
  'dnd-link': {
    x: 100,
    y: 65,
    xname: 'dnd-link',
    links: ['alias'],
  },
  dotbox: {
    xname: 'dotbox',
    links: ['dot_box_mask', 'draped_box', 'icon', 'target'],
  },
  fd_double_arrow: {
    winname: 'Dgn2',
    xname: 'fd_double_arrow',
    links: ['fcf1c3c7cd4491d801f1e1c78f100000', 'nesw-resize', 'size_bdiag'],
  },
  grabbing: {
    x: 128,
    y: 66,
    winname: 'Grabbing',
    xname: 'grabbing',
    links: [
      'closedhand',
      'dnd-move',
      'dnd-none',
      'fcf21c00b30f7e3f83fe0dfd12e71cff',
    ],
  },
  hand1: {
    x: 144,
    y: 79,
    winname: 'Pan',
    xname: 'hand1',
    links: ['grab', 'openhand'],
  },
  hand2: {
    x: 114,
    y: 18,
    winname: 'Link',
    xname: 'hand2',
    links: [
      '9d800788f1b08800ae810202380a0822',
      'e29285e634086352946a0e7090d73106',
      'pointer',
      'pointing_hand',
    ],
  },
  left_ptr: {
    x: 55,
    y: 17,
    winname: 'Pointer',
    xname: 'left_ptr',
    links: ['arrow', 'default', 'top_left_arrow'],
  },
  left_ptr_watch: {
    x: 55,
    y: 17,
    winname: 'Work',
    xname: 'left_ptr_watch',
    links: [
      '00000000000000020006000e7e9ffc3f',
      '08e8e1c95fe2fc01f976f1e063a24ccd',
      '3ecb610c1bf2410f44200f48c40d3599',
      'progress',
    ],
  },
  left_side: {
    x: 21,
    y: 128,
    xname: 'left_side',
    links: ['w-resize'],
  },
  left_tee: {
    x: 230,
    y: 128,
    xname: 'left_tee',
  },
  link: {
    x: 55,
    y: 17,
    xname: 'link',
    links: [
      '3085a0e285430894940527032f8b26df',
      '640fb0e74195791501fd1ed57b41487f',
      'a2a266d0498c3104214a47bd64ab0fc8',
    ],
  },
  ll_angle: {
    x: 30,
    y: 223,
    xname: 'll_angle',
  },
  lr_angle: {
    x: 224,
    y: 230,
    xname: 'lr_angle',
  },
  move: {
    winname: 'Move',
    xname: 'move',
    links: [
      '4498f0e0c1937ffe01fd06f973665830',
      '9081237383d90e509aa00f00170e968f',
      'all-scroll',
      'fleur',
      'size_all',
    ],
  },
  pencil: {
    x: 46,
    y: 211,
    winname: 'Handwriting',
    xname: 'pencil',
    links: ['draft'],
  },
  plus: {
    xname: 'plus',
    links: ['cell'],
  },
  'pointer-move': {
    x: 55,
    y: 17,
    xname: 'pointer-move',
  },
  question_arrow: {
    x: 42,
    y: 86,
    winname: 'Help',
    xname: 'question_arrow',
    links: [
      '5c6cd98b3f3ebcb1f9c7f1c204630408',
      'd9ce0ab605698f320427677b458ad60b',
      'help',
      'left_ptr_help',
      'whats_this',
    ],
  },
  right_ptr: {
    x: 204,
    y: 17,
    winname: 'Alternate',
    xname: 'right_ptr',
    links: ['draft_large', 'draft_small'],
  },
  right_side: {
    x: 233,
    y: 128,
    xname: 'right_side',
    links: ['e-resize'],
  },
  right_tee: {
    x: 29,
    y: 128,
    xname: 'right_tee',
  },
  sb_down_arrow: {
    x: 128,
    y: 222,
    xname: 'sb_down_arrow',
    links: ['down-arrow'],
  },
  sb_h_double_arrow: {
    winname: 'Horz',
    xname: 'sb_h_double_arrow',
    links: [
      '028006030e0e7ebffc7f7070c0600140',
      '14fef782d02440884392942c1120523',
      'col-resize',
      'ew-resize',
      'h_double_arrow',
      'size-hor',
      'size_hor',
      'split_h',
    ],
  },
  sb_left_arrow: {
    x: 33,
    y: 128,
    xname: 'sb_left_arrow',
    links: ['left-arrow'],
  },
  sb_right_arrow: {
    x: 223,
    y: 128,
    xname: 'sb_right_arrow',
    links: ['right-arrow'],
  },
  sb_up_arrow: {
    x: 128,
    y: 33,
    xname: 'sb_up_arrow',
    links: ['up-arrow'],
  },
  sb_v_double_arrow: {
    winname: 'Vert',
    xname: 'sb_v_double_arrow',
    links: [
      '00008160000006810000408080010102',
      '2870a09082c103050810ffdffffe0204',
      'double_arrow',
      'ns-resize',
      'row-resize',
      'size-ver',
      'size_ver',
      'split_v',
      'v_double_arrow',
    ],
  },
  tcross: {
    xname: 'tcross',
    links: ['color-picker'],
  },
  top_left_corner: {
    x: 29,
    y: 24,
    xname: 'top_left_corner',
    links: ['nw-resize'],
  },
  top_right_corner: {
    x: 229,
    y: 24,
    xname: 'top_right_corner',
    links: ['ne-resize'],
  },
  top_side: {
    x: 128,
    y: 23,
    xname: 'top_side',
    links: ['n-resize'],
  },
  top_tee: {
    x: 128,
    y: 27,
    xname: 'top_tee',
  },
  ul_angle: {
    x: 33,
    y: 33,
    xname: 'ul_angle',
  },
  ur_angle: {
    x: 225,
    y: 33,
    xname: 'ur_angle',
  },
  'vertical-text': {
    xname: 'vertical-text',
  },
  wait: {
    winname: 'Busy',
    xname: 'wait',
    links: ['watch'],
  },
  'wayland-cursor': {
    xname: 'wayland-cursor',
  },
  X_cursor: {
    xname: 'X_cursor',
    links: ['pirate', 'x-cursor'],
  },
  xterm: {
    winname: 'Text',
    xname: 'xterm',
    links: ['ibeam', 'text'],
  },
  'zoom-in': {
    x: 116,
    y: 116,
    winname: 'Zoom-in',
    xname: 'zoom-in',
  },
  'zoom-out': {
    x: 116,
    y: 116,
    winname: 'Zoom-out',
    xname: 'zoom-out',
  },
  person: {
    x: 55,
    y: 17,
    winname: 'Person',
  },
  pin: {
    x: 55,
    y: 17,
    winname: 'Pin',
  },
};
