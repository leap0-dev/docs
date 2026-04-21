import { renderMermaidSVG } from 'beautiful-mermaid';

export async function Mermaid({ chart }: { chart: string }) {
  try {
    const svg = softenMermaidSvg(renderMermaidSVG(chart, {
      bg: 'var(--color-fd-background)',
      fg: 'var(--color-fd-foreground)',
      interactive: true,
      transparent: true,
    }));

    return <div dangerouslySetInnerHTML={{ __html: svg }} />;
  } catch {
    return (
      <pre>
        <code>{chart}</code>
      </pre>
    );
  }
}

function softenMermaidSvg(svg: string) {
  return svg
    .replaceAll('rx="6" ry="6"', 'rx="18" ry="18"')
    .replaceAll('rx="2" ry="2"', 'rx="10" ry="10"')
    .replace(/<polyline([^>]*)points="([^"]+)"([^>]*)\/>/g, (match, before, points, after) => {
      const attrs = `${before}${after}`;
      if (!attrs.includes('class="edge"')) {
        return match;
      }

      return `<path${attrs} d="${roundedPathFromPoints(points, 24)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
}

function roundedPathFromPoints(pointsAttr: string, radius: number) {
  const points = pointsAttr
    .trim()
    .split(/\s+/)
    .map((point) => {
      const [x, y] = point.split(',').map(Number);
      return { x, y };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (points.length < 2) {
    return '';
  }

  let path = `M ${points[0]!.x} ${points[0]!.y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const current = points[index]!;
    const next = points[index + 1];

    if (!next) {
      path += ` L ${current.x} ${current.y}`;
      continue;
    }

    const incoming = distance(previous, current);
    const outgoing = distance(current, next);
    const cornerRadius = Math.min(radius, incoming / 2, outgoing / 2);

    if (cornerRadius < 1) {
      path += ` L ${current.x} ${current.y}`;
      continue;
    }

    const entry = moveToward(current, previous, cornerRadius);
    const exit = moveToward(current, next, cornerRadius);

    path += ` L ${entry.x} ${entry.y}`;
    path += ` Q ${current.x} ${current.y} ${exit.x} ${exit.y}`;
  }

  return path;
}

function moveToward(from: Point, to: Point, distanceToMove: number) {
  const totalDistance = distance(from, to);
  if (totalDistance === 0) {
    return from;
  }

  const ratio = distanceToMove / totalDistance;

  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

type Point = {
  x: number;
  y: number;
};
