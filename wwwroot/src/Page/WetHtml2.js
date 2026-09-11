import React, { useState } from 'react';
import { t } from '../i18n';
import { normalizeImageAssetSrc } from '../Assets/imageSource';
import './WetHtml2.css';
import { getWetRows } from './wetRows';
import { getWetAnimationClass } from './wetAnimations';

export default function WetHtml2({ attrs, hovered, onHoverChange, onActivate }) {
    const [mouseInside, setMouseInside] = useState(false);
    const visible = attrs.labelDisplay === 'always' || (hovered === undefined ? mouseInside : hovered);
    return <div className="temperature-humidity-two"
        onClick={onActivate}
        style={{ width: attrs.width, height: attrs.height }}
        onMouseEnter={() => { setMouseInside(true); if (onHoverChange) onHoverChange(true); }}
        onMouseLeave={() => { setMouseInside(false); if (onHoverChange) onHoverChange(false); }}>
        <img src={normalizeImageAssetSrc(attrs.image || 'Images/icon/temperature-humidity.svg')}
            alt={attrs.text || t('temperatureHumidity2.name')} draggable={false} />
        {visible && <div className={'temperature-humidity-two-readings ' + getWetAnimationClass(attrs)} role="tooltip">
            {getWetRows(attrs).map(row => <React.Fragment key={row.id}>
                <span>{row.label}</span>
                <strong style={{ color: row.color }}>{row.value == null ? '--' : row.value}</strong>
                <span>{row.unit}</span>
            </React.Fragment>)}
        </div>}
    </div>;
}
