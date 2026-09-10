# 幽灵吉祥物白底转透明：从四边 BFS 泛洪，仅外部相连的白色变透明
from PIL import Image
from collections import deque

im = Image.open("public/brand/ghost.png").convert("RGBA")
w, h = im.size
px = im.load()

def near_white(p):
    return p[0] > 232 and p[1] > 232 and p[2] > 232

visited = bytearray(w * h)
q = deque()
for x in range(w):
    q.append((x, 0))
    q.append((x, h - 1))
for y in range(h):
    q.append((0, y))
    q.append((w - 1, y))

while q:
    x, y = q.popleft()
    i = y * w + x
    if visited[i]:
        continue
    visited[i] = 1
    if not near_white(px[x, y]):
        continue
    px[x, y] = (255, 255, 255, 0)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not visited[ny * w + nx]:
            q.append((nx, ny))

# 裁掉透明边距
bbox = im.getbbox()
im = im.crop(bbox)
im.save("public/brand/ghost.png")
print("done:", im.size, "mode:", im.mode)
