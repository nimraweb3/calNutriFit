"""Render original coordinate-based movement diagrams as local animated GIFs."""
import json, math, re
from pathlib import Path
from PIL import Image, ImageDraw

guides = json.loads(Path('.workout-assets/guides.json').read_text())
out = Path('public/workouts')
out.mkdir(parents=True, exist_ok=True)
edges = [(1,2),(1,3),(1,4),(3,5),(4,6),(2,7),(2,8),(7,9),(8,10)]
weighted = {'Bicep curl','Front raise','Lateral raise','Triceps kickback','Bent-over row'}
for name, guide in guides.items():
    poses = guide['poses']
    frames = []
    for frame in range(48):
        phase = frame / 48 * len(poses)
        index = int(phase)
        blend = (1 - math.cos((phase-index)*math.pi))/2
        points = [[2*(a+(b-a)*blend) for a,b in zip(p,q)] for p,q in zip(poses[index],poses[(index+1)%len(poses)])]
        img = Image.new('RGB',(400,390),'#f6faf7')
        draw = ImageDraw.Draw(img)
        draw.line((40,360,370,360),fill='#cdded4',width=4)
        if name == 'Incline push-up':
            draw.line((64,220,174,220,174,360),fill='#b0c7b9',width=10)
            draw.line((80,220,80,360),fill='#b0c7b9',width=10)
        if name == 'Step-up':
            draw.rectangle((76,270,170,358),fill='#d8e8df')
        for a,b in edges:
            color = '#72a48c' if a in (4,8) else '#247355'
            draw.line((*points[a],*points[b]),fill=color,width=14)
            for x,y in (points[a],points[b]):
                draw.ellipse((x-7,y-7,x+7,y+7),fill=color)
        x,y = points[0]
        draw.ellipse((x-22,y-22,x+22,y+22),fill='#247355')
        if 'dumbbell' in name.lower() or name in weighted or name == 'Goblet squat':
            for i in ([5] if name == 'Goblet squat' else [5,6]):
                x,y = points[i]
                draw.line((x-12,y,x+12,y),fill='#243e33',width=6)
                for dx in (-15,9):
                    draw.rounded_rectangle((x+dx,y-9,x+dx+6,y+9),radius=2,fill='#243e33')
        frames.append(img)
    slug = re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
    frames[0].save(out / f'{slug}.png',optimize=True)
    frames[0].save(out / f'{slug}.gif',save_all=True,append_images=frames[1:],duration=85,loop=0,optimize=True)
print(f'Rendered {len(guides)} animated GIFs and pause posters.')
