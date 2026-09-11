import { t } from '../i18n';

export const getWetRows = (attrs) => Array.isArray(attrs.rows) ? attrs.rows : [
    { id: 'temperature', label: t('temperatureHumidity2.temperature'), value: attrs.dataWen, unit: '℃', color: attrs.fill1 },
    { id: 'humidity', label: t('temperatureHumidity2.humidity'), value: attrs.dataWet, unit: '%', color: attrs.fill2 }
];

export const initializeWetRows = (moduleJson) => {
    const attrs = moduleJson.children[0].attrs;
    if (Array.isArray(attrs.rows)) return;
    attrs.rows = getWetRows(attrs);
    const binding = (moduleJson.attrs.dataKey || [])[0];
    moduleJson.attrs.dataKey = binding ? attrs.rows.map((row, index) => ({
        ...binding, rowId: row.id, name: t(index === 0 ? 'auto.k0610' : 'auto.k0611')
    })) : [];
};
