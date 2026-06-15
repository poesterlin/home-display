import { expect, test } from 'bun:test';

import { validateProjectSchema } from './project-schema';

test('accepts detail actions and targetless services used by the editor', () => {
  const result = validateProjectSchema({
    name: 'Test',
    display: { width: 480, height: 480 },
    dashboardPages: [
      {
        id: 'page-1',
        name: 'Home',
        components: [
          {
            id: 'button-1',
            type: 'button',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            label: 'Open',
            onTap: { type: 'OPEN_DETAIL', targetId: 'DETAIL_1' },
          },
          {
            id: 'tabs-1',
            type: 'tab_container',
            position: { x: 0, y: 50 },
            size: { width: 220, height: 127 },
            onTap: { type: 'OPEN_DETAIL', targetId: 'DETAIL_1' },
            tabs: [
              {
                id: 'tab-1',
                name: 'Tab 1',
                components: [
                  {
                    id: 'button-2',
                    type: 'button',
                    position: { x: 0, y: 0 },
                    size: { width: 80, height: 44 },
                    onTap: { type: 'SERVICE_CALL', service: 'script.skip_song' },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    detailViews: [
      {
        id: 'DETAIL_1',
        title: 'Detail 1',
        height: 640,
        components: [],
      },
    ],
  });

  expect(result.errors).toEqual([]);
  expect(result.valid).toBe(true);
});
