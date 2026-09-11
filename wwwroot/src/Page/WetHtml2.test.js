import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import templates from './Data/ScreenTemplate.json';
import PreviewDeal from './PreviewDeal';
import { t } from '../i18n';
import WetRowsEditor from './WetRowsEditor';
import { initializeWetRows } from './wetRows';
import { splitPreviewShapeByDataSource, mergePreviewShapesByDataSource } from '../Assets/dataSource';
import { getWetAnimationClass, WET_HOVER_ANIMATIONS, WET_ALWAYS_ANIMATIONS } from './wetAnimations';

test('supports six entry and three loop effects with safe defaults', () => {
    expect(WET_HOVER_ANIMATIONS.filter(value => value !== 'none')).toHaveLength(6);
    expect(WET_ALWAYS_ANIMATIONS.filter(value => value !== 'none')).toHaveLength(3);
    WET_HOVER_ANIMATIONS.forEach(value => expect(getWetAnimationClass({ hoverAnimation: value })).toBe('wet-enter-' + value));
    WET_ALWAYS_ANIMATIONS.forEach(value => expect(getWetAnimationClass({ labelDisplay: 'always', alwaysAnimation: value })).toBe('wet-loop-' + value));
    expect(getWetAnimationClass({ hoverAnimation: 'unknown' })).toBe('wet-enter-fade');
    expect(getWetAnimationClass({ labelDisplay: 'always' })).toBe('wet-loop-none');
});

test('adds, edits and removes rows while retaining legacy bindings through serialization', () => {
    let moduleJson = JSON.parse(JSON.stringify(templates[0].moduleJson));
    moduleJson.attrs.dataKey = [{ key: '9' }];
    const container = document.createElement('div');
    const root = createRoot(container);
    const render = () => root.render(<WetRowsEditor moduleJson={moduleJson} onChange={next => { moduleJson = next; render(); }} onBind={() => {}} />);
    act(render);
    act(() => Simulate.click(container.querySelector('.wet-row-add')));
    expect(moduleJson.children[0].attrs.rows).toHaveLength(3);
    expect(moduleJson.attrs.dataKey.map(binding => binding.key)).toEqual(['9', '9']);
    act(() => Simulate.change(container.querySelectorAll('input')[6], { target: { value: 'Temperature 2' } }));
    act(() => Simulate.blur(container.querySelectorAll('input')[6]));
    expect(JSON.parse(JSON.stringify(moduleJson)).children[0].attrs.rows[2].label).toBe('Temperature 2');
    act(() => Simulate.click(container.querySelectorAll('.wet-row-actions')[2].lastChild));
    expect(moduleJson.children[0].attrs.rows).toHaveLength(2);
    act(() => root.unmount());
});

test('merges independent row values from different hosts without losing row order', () => {
    const source = { id: 'sensor', moduleJson: JSON.parse(JSON.stringify(templates[0].moduleJson)) };
    initializeWetRows(source.moduleJson);
    source.moduleJson.attrs.dataKey = [
        { key: '1', name: 'sensor', rowId: 'temperature', sourceHost: '192.168.0.1' },
        { key: '1', name: 'sensor', rowId: 'humidity', sourceHost: '192.168.0.2' }
    ];
    const parts = splitPreviewShapeByDataSource(source).map((part, i) => PreviewDeal.PreviewDeal([part], { data: [] }, {
        data: [{ DevID: '1', LastReceiveData: JSON.stringify({ sensor: String(20 + i) }) }]
    })[0]);
    expect(mergePreviewShapesByDataSource(parts)[0].moduleJson.children[0].attrs.rows.map(row => row.value)).toEqual(['20', '21']);
});

beforeAll(() => { global.IS_REACT_ACT_ENVIRONMENT = true; });
afterAll(() => { delete global.IS_REACT_ACT_ENVIRONMENT; });

test('selects animations by display mode without restarting on live data updates', () => {
    const WetHtml2 = require('./WetHtml2').default;
    const container = document.createElement('div');
    const root = createRoot(container);
    const attrs = { width: 100, height: 100, hoverAnimation: 'slide-up', alwaysAnimation: 'float' };
    act(() => root.render(<WetHtml2 attrs={attrs} hovered={true} />));
    const panel = container.querySelector('[role="tooltip"]');
    expect(panel.className).toContain('wet-enter-slide-up');
    act(() => root.render(<WetHtml2 attrs={{ ...attrs, dataWen: 25 }} hovered={true} />));
    expect(container.querySelector('[role="tooltip"]')).toBe(panel);
    act(() => root.render(<WetHtml2 attrs={{ ...attrs, labelDisplay: 'always' }} hovered={false} />));
    expect(container.querySelector('[role="tooltip"]').className).toContain('wet-loop-float');
    act(() => root.render(<WetHtml2 attrs={{ ...attrs, labelDisplay: 'always', alwaysAnimation: 'none' }} />));
    expect(container.querySelector('[role="tooltip"]').className).toContain('wet-loop-none');
    act(() => root.render(<WetHtml2 attrs={attrs} hovered={false} />));
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    act(() => root.unmount());
});

test('keeps typing local until blur even when parent props lag behind', () => {
    const moduleJson = JSON.parse(JSON.stringify(templates[0].moduleJson));
    const container = document.createElement('div');
    const root = createRoot(container);
    const onChange = jest.fn();
    const render = () => root.render(<WetRowsEditor moduleJson={moduleJson} onChange={onChange} onBind={() => {}} />);
    act(render);
    const input = container.querySelector('input');
    act(() => Simulate.compositionStart(input));
    act(() => Simulate.change(input, { target: { value: 's' } }));
    act(render);
    expect(input.value).toBe('s');
    act(() => Simulate.change(input, { target: { value: 'ss' } }));
    act(() => Simulate.compositionEnd(input));
    expect(input.value).toBe('ss');
    expect(onChange).not.toHaveBeenCalled();
    act(() => Simulate.blur(input));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].children[0].attrs.rows[0].label).toBe('ss');
    act(() => Simulate.click(container.querySelector('.wet-row-add')));
    expect(onChange.mock.calls[1][0].children[0].attrs.rows[0].label).toBe('ss');
    expect(onChange.mock.calls[1][0].children[0].attrs.rows).toHaveLength(3);
    act(() => root.unmount());
});

test('forwards a background click once to the configured event', () => {
    const WetHtml2 = require('./WetHtml2').default;
    const container = document.createElement('div');
    const root = createRoot(container);
    const onActivate = jest.fn();
    act(() => root.render(<WetHtml2 attrs={{ width: 100, height: 100 }} onActivate={onActivate} />));
    act(() => Simulate.click(container.querySelector('img')));
    expect(onActivate).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
});

test('renders editable labels and units with independently bound extra rows', () => {
    const source = JSON.parse(JSON.stringify(templates[0]));
    source.moduleJson.children[0].attrs.rows = [
        { id: 'a', label: 'Room', value: '1', unit: 'C' },
        { id: 'b', label: 'Room 2', value: '22.3', unit: 'C' },
        { id: 'c', label: 'Custom', value: '0', unit: '%' }
    ];
    source.moduleJson.attrs.dataKey = [{ rowId: 'a', key: '1', name: 'sensor' }, { rowId: 'c', parkey: '2' }];
    const result = PreviewDeal.PreviewDeal([source], { data: [] }, { data: [
        { DevID: '1', LastReceiveData: JSON.stringify({ sensor: '28.6(C)' }) }
    ] }, undefined, { data: [{ id: '2', Result: '0' }] });
    expect(result[0].moduleJson.children[0].attrs.rows.map(row => row.value)).toEqual(['28.6', '22.3', '0']);
    const WetHtml2 = require('./WetHtml2').default;
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => root.render(<WetHtml2 attrs={{ ...result[0].moduleJson.children[0].attrs, labelDisplay: 'always' }} />));
    expect(container.querySelectorAll('strong')).toHaveLength(3);
    expect(container.textContent).toContain('Room 222.3C');
    act(() => root.unmount());
});

test('keeps always-visible readings after mouse leave and supports switching back to hover', () => {
    const WetHtml2 = require('./WetHtml2').default;
    const container = document.createElement('div');
    const root = createRoot(container);
    const attrs = { width: 100, height: 100, dataWen: 23.33, dataWet: 56.33, labelDisplay: 'always' };
    act(() => root.render(<WetHtml2 attrs={attrs} hovered={false} />));
    expect(container.querySelector('[role="tooltip"]')).not.toBeNull();
    act(() => Simulate.mouseLeave(container.firstChild));
    expect(container.querySelector('[role="tooltip"]')).not.toBeNull();
    act(() => root.render(<WetHtml2 attrs={{ ...attrs, labelDisplay: 'hover' }} hovered={false} />));
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    act(() => root.unmount());
});

test('provides an independently editable hover template with live device data', () => {
    const template = templates.find(item => item.moduleName === '__i18n__.temperatureHumidity2.name');
    expect(template).toBeDefined();
    const source = JSON.parse(JSON.stringify(template));
    source.moduleJson.attrs.dataKey = [{ key: '1' }];
    source.moduleJson.attrs.moduleAttr[0].attrGroupName = t('auto.k0002');
    const result = PreviewDeal.PreviewDeal([source], { data: [] }, { data: [{
        DevID: '1', LastReceiveData: JSON.stringify({ [t('auto.k0610')]: '26.5(C)', [t('auto.k0611')]: '58(%)' })
    }] });
    expect(result[0].moduleJson.children[0].attrs.dataWen).toBe(26.5);
    expect(result[0].moduleJson.children[0].attrs.dataWet).toBe(58);
});

test('shows readings only on hover and preserves replacement images and zero values', () => {
    const WetHtml2 = require('./WetHtml2').default;
    const container = document.createElement('div');
    const root = createRoot(container);
    const attrs = { width: 100, height: 100, image: 'Images/uploads/custom.jpg', dataWen: 0, dataWet: 56.33, fill1: '#ff2626' };
    act(() => root.render(<WetHtml2 attrs={attrs} />));
    expect(container.querySelector('img').getAttribute('src')).toBe(attrs.image);
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    act(() => Simulate.mouseEnter(container.firstChild));
    expect(container.querySelector('[role="tooltip"]').textContent).toContain('0');
    expect(container.querySelector('[role="tooltip"]').textContent).toContain('56.33');
    act(() => Simulate.mouseLeave(container.firstChild));
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    act(() => root.render(<WetHtml2 attrs={{ ...attrs, image: 'Images/uploads/custom.png', dataWen: 28.6 }} hovered={true} />));
    expect(container.querySelector('img').getAttribute('src')).toBe('Images/uploads/custom.png');
    expect(container.querySelector('[role="tooltip"]').textContent).toContain('28.6');
    act(() => root.render(<WetHtml2 attrs={attrs} hovered={false} />));
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    act(() => root.unmount());
});
