import React, { useState, useEffect, useRef } from 'react';
import { t } from '../i18n';
import { getWetRows, initializeWetRows } from './wetRows';
import './WetHtml2.css';

function RowTextInput({ value, label, onCommit }) {
    const text = value == null ? '' : String(value);
    const [draft, setDraft] = useState(text);
    const dirty = useRef(false);
    useEffect(() => {
        if (!dirty.current) setDraft(text);
    }, [text]);
    return <input aria-label={label} value={draft}
        onChange={event => { dirty.current = true; setDraft(event.target.value); }}
        onBlur={() => {
            if (!dirty.current) return;
            dirty.current = false;
            if (draft !== text) onCommit(draft);
        }} />;
}

export default function WetRowsEditor({ moduleJson, onChange, onBind }) {
    const latestModule = useRef(moduleJson);
    useEffect(() => { latestModule.current = moduleJson; }, [moduleJson]);
    const editable = JSON.parse(JSON.stringify(moduleJson));
    initializeWetRows(editable);
    const rows = getWetRows(editable.children[0].attrs);
    const update = (action) => {
        const next = JSON.parse(JSON.stringify(latestModule.current));
        initializeWetRows(next);
        action(next.children[0].attrs.rows, next.attrs);
        latestModule.current = next;
        onChange(next);
    };
    return <section className="wet-rows-editor">
        <div className="attrTitle">{t('temperatureHumidity2.rows')}</div>
        {rows.map(row => {
            const binding = (editable.attrs.dataKey || []).find(item => item.rowId === row.id);
            return <div className="wet-row-editor" key={row.id}>
                {['label', 'value', 'unit'].map(field => <label key={field}>
                    {t('temperatureHumidity2.' + field)}
                    <RowTextInput label={t('temperatureHumidity2.' + field)} value={row[field]}
                        onCommit={value => {
                            update(nextRows => { nextRows.find(item => item.id === row.id)[field] = value; });
                        }} />
                </label>)}
                <div className="wet-row-actions">
                    <button type="button" onClick={() => onBind(row.id)}>{t('temperatureHumidity2.bind')}</button>
                    <button type="button" disabled={!binding} onClick={() => update((_, attrs) => {
                        attrs.dataKey = attrs.dataKey.filter(item => item.rowId !== row.id);
                    })}>{t('temperatureHumidity2.unbind')}</button>
                    <button type="button" disabled={rows.length <= 1} onClick={() => update((nextRows, attrs) => {
                        nextRows.splice(nextRows.findIndex(item => item.id === row.id), 1);
                        attrs.dataKey = attrs.dataKey.filter(item => item.rowId !== row.id);
                    })}>{t('temperatureHumidity2.remove')}</button>
                </div>
                {binding && <small>{binding.sourceHost ? binding.sourceHost + ' / ' : ''}{binding.name || binding.parkey}</small>}
            </div>;
        })}
        <button type="button" className="wet-row-add" onClick={() => update(nextRows => nextRows.push({
            id: 'row-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
            label: t('temperatureHumidity2.newLabel'), value: '22.3', unit: '℃', color: '#03DFFB'
        }))}>＋ {t('temperatureHumidity2.add')}</button>
    </section>;
}
