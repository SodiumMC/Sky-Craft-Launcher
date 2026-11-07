"""给已挂载的 DMG 写入 Finder 布局（背景图 + 图标位置），不依赖 Finder 自动化。"""
import sys
from ds_store import DSStore
from mac_alias import Alias

mount = sys.argv[1].rstrip('/')
bg = f"{mount}/.background.png"
alias = Alias.for_file(bg).to_bytes()
ds = f"{mount}/.DS_Store"

with DSStore.open(ds, 'w+') as d:
    d['.']['bwsp'] = {
        'WindowBounds': '{{200, 120}, {660, 400}}',
        'ShowStatusBar': False,
        'ContainerShowSidebar': False,
        'PreviewPaneVisibility': False,
        'SidebarWidth': 0,
        'ShowTabView': False,
        'ShowToolbar': False,
    }
    d['.']['icvp'] = {
        'viewOptionsVersion': 1,
        'backgroundType': 2,
        'backgroundColorRed': 1.0,
        'backgroundColorGreen': 1.0,
        'backgroundColorBlue': 1.0,
        'backgroundImageAlias': alias,
        'iconSize': 96.0,
        'textSize': 12.0,
        'arrangeBy': 'none',
        'showItemInfo': False,
        'labelOnBottom': True,
        'gridSpacing': 100.0,
        'scrollPosition': {'x': 0, 'y': 0},
    }
    d['SCL.app']['Iloc'] = (170, 205)
    d['Applications']['Iloc'] = (490, 205)
print('dsstore ok')
