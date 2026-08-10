import React, { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import {
  FiSearch, FiMapPin, FiLoader, FiX, FiNavigation,
  FiCopy, FiCheck, FiMap,
} from 'react-icons/fi';
import { searchAddress } from '../services/geocodingService';

/**
 * LocationSearch — tìm địa chỉ bằng OpenStreetMap (Nominatim + Photon).
 *
 * Props:
 *  onSelectLocation({ displayName, address, latitude, longitude })
 */
const LocationSearch = ({ onSelectLocation }) => {
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [isOpen, setIsOpen]             = useState(false);
  const [selectedLocation, setSelected] = useState(null);
  const [activeIndex, setActiveIndex]   = useState(-1);
  const [copied, setCopied]             = useState(false);

  const containerRef     = useRef(null);
  const inputRef         = useRef(null);
  const debounceRef      = useRef(null);
  const isProgrammatic   = useRef(false); // true khi query được set bởi code, không phải user gõ

  // ─── Debounced search ──────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 3) {
      setResults([]); setIsOpen(false); setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchAddress(q, 6);
      setResults(data);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch (err) {
      setError(err.message || 'Không thể kết nối. Vui lòng thử lại.');
      setResults([]);
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bỏ qua search nếu query được set bởi code (sau khi chọn kết quả)
    if (isProgrammatic.current) {
      isProgrammatic.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 450);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  // ─── Click-outside ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Keyboard nav ─────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); return; }
    if (!isOpen || !results.length) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIndex(i => (i + 1) % results.length); }
    else if (e.key === 'ArrowUp')  { e.preventDefault(); setActiveIndex(i => i <= 0 ? results.length - 1 : i - 1); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); pickResult(results[activeIndex]); }
  };

  const pickResult = (r) => {
    isProgrammatic.current = true; // ngăn useEffect trigger search mới
    setSelected(r);
    setIsOpen(false);
    setQuery(r.display_name);
  };

  const handleClear = () => {
    setQuery(''); setResults([]); setSelected(null);
    setIsOpen(false); setError(null);
    inputRef.current?.focus();
  };

  const handleUse = () => {
    if (!selectedLocation) return;
    onSelectLocation({
      displayName: selectedLocation.display_name,
      address:     selectedLocation.address || selectedLocation.display_name,
      latitude:    parseFloat(selectedLocation.lat),
      longitude:   parseFloat(selectedLocation.lon),
    });
    setSelected(null);
    setQuery('');
    setResults([]);
  };

  const handleCopyCoords = () => {
    if (!selectedLocation) return;
    const txt = `${parseFloat(selectedLocation.lat).toFixed(8)}, ${parseFloat(selectedLocation.lon).toFixed(8)}`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lat8 = selectedLocation ? parseFloat(selectedLocation.lat).toFixed(8) : '';
  const lon8 = selectedLocation ? parseFloat(selectedLocation.lon).toFixed(8) : '';

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2 w-full">

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <span className="absolute left-3.5 pointer-events-none text-slate-400">
          {loading
            ? <FiLoader className="w-4 h-4 animate-spin text-primary-500" />
            : <FiSearch className="w-4 h-4" />
          }
        </span>

        <input
          ref={inputRef}
          id="location-search-input"
          type="text"
          value={query}
          autoComplete="off"
          spellCheck={false}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length || error) setIsOpen(true); }}
          placeholder="VD: 16A Nguyễn Chí Thanh, Phú Quốc, An Giang..."
          className={clsx(
            'w-full rounded-xl border bg-white dark:bg-slate-900',
            'text-slate-800 dark:text-slate-100 text-sm py-2.5 pl-10 pr-10',
            'placeholder:text-slate-400 dark:placeholder:text-slate-600',
            'transition-all duration-200',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10',
            'border-slate-200 dark:border-slate-800',
          )}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            aria-label="Xóa"
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Dropdown ──────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/70 dark:shadow-black/50 overflow-hidden animate-fade-in">

          {/* Error */}
          {error && (
            <div className="px-4 py-3 flex items-center gap-2 text-xs text-rose-500">
              <FiX className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Loading inline */}
          {loading && (
            <div className="px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
              <FiLoader className="w-3.5 h-3.5 animate-spin" />
              Đang tìm kiếm...
            </div>
          )}

          {/* Empty */}
          {!error && !loading && results.length === 0 && query.trim().length >= 3 && (
            <div className="px-5 py-6 text-center">
              <FiMap className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Không tìm thấy địa chỉ phù hợp.</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Thử: <em>tên đường + tên thành phố</em><br />
                VD: <em>"Nguyễn Chí Thanh, Phú Quốc"</em>
              </p>
            </div>
          )}

          {/* Results */}
          {!error && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {results.map((r, idx) => (
                <li key={`${r.place_id}_${idx}`}>
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className={clsx(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-100',
                      activeIndex === idx
                        ? 'bg-primary-50 dark:bg-primary-950/25'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                    )}
                  >
                    {/* Pin icon */}
                    <span className="mt-0.5 w-5 h-5 flex items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 shrink-0">
                      <FiMapPin className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                    </span>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-1 flex-1">
                          {r.display_name.split(',')[0]}
                        </span>
                        {r.typeLabel && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                            {r.typeLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {r.display_name.split(',').slice(1).join(',').trim() || r.display_name}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Source note */}
          {results.length > 0 && (
            <div className="px-4 py-1.5 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 text-right">
              Dữ liệu: OpenStreetMap contributors
            </div>
          )}
        </div>
      )}

      {/* ── Preview card ──────────────────────────────────────────────────── */}
      {selectedLocation && !isOpen && (
        <div className="rounded-2xl border border-primary-200 dark:border-primary-800/40 bg-gradient-to-br from-primary-50/80 to-white dark:from-primary-950/30 dark:to-slate-900 p-4 flex flex-col gap-3 animate-fade-in shadow-sm shadow-primary-100/50 dark:shadow-black/20">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
              <FiNavigation className="w-3 h-3" />
              Tọa độ tìm thấy
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Đóng"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-0.5 bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Địa chỉ</span>
            <span className="text-xs text-slate-800 dark:text-slate-100 font-medium leading-snug">
              {selectedLocation.display_name}
            </span>
            {(selectedLocation.city || selectedLocation.province) && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                {[selectedLocation.city, selectedLocation.province].filter(Boolean).join(' • ')}
              </span>
            )}
          </div>

          {/* Coords grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5 bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Latitude</span>
              <span className="text-xs font-mono font-semibold text-primary-700 dark:text-primary-300">{lat8}</span>
            </div>
            <div className="flex flex-col gap-0.5 bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Longitude</span>
              <span className="text-xs font-mono font-semibold text-primary-700 dark:text-primary-300">{lon8}</span>
            </div>
          </div>

          {/* Copy coords */}
          <button
            type="button"
            onClick={handleCopyCoords}
            className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {copied
              ? <><FiCheck className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500 font-semibold">Đã sao chép!</span></>
              : <><FiCopy className="w-3 h-3" />Sao chép tọa độ</>
            }
          </button>

          {/* CTA */}
          <button
            type="button"
            onClick={handleUse}
            className={clsx(
              'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4',
              'text-xs font-bold text-white tracking-wide',
              'bg-primary-600 hover:bg-primary-700 active:scale-[.98]',
              'transition-all duration-150 shadow-md shadow-primary-500/30',
            )}
          >
            <FiMapPin className="w-3.5 h-3.5" />
            Sử dụng tọa độ này
          </button>

          <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
            OSM không có số nhà cho mọi địa chỉ ở VN. Tọa độ là trung tâm đường (~25–100m). Có thể chỉnh thủ công trong form.
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
