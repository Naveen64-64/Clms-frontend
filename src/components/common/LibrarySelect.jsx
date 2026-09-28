import React, { useState, useEffect } from 'react';
import { libraryApi } from '../../api/libraryApi';
import { Select } from '../ui/Select';

export const LibrarySelect = ({
  value = '',
  onChange,
  className = '',
  includeAllOption = true,
  allOptionLabel = 'All Libraries',
  mode = 'public',
  studentGender = null,
  disabled = false,
  id,
  name,
  libraries: propLibraries = null,
  ...props
}) => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(!propLibraries || propLibraries.length === 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (propLibraries && Array.isArray(propLibraries) && propLibraries.length > 0) {
      setLibraries(propLibraries);
      setLoading(false);
      setError(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    libraryApi
      .getAllLibraries()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.data?.data || [];
        
        if (Array.isArray(list) && list.length > 0) {
          setLibraries(list);
          setError(false);
        } else {
          setLibraries([]);
          setError(true);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to fetch library list:', err);
        setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propLibraries]);

  // Filter libraries by gender if in student mode
  let displayLibraries = libraries;
  if (mode === 'student' && studentGender === 'MALE') {
    displayLibraries = libraries.filter(
      (lib) => !lib.isWomenOnly && lib.code !== 'KIET_WOMEN' && !lib.name?.toLowerCase().includes('women')
    );
  }

  return (
    <Select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      className={className}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <option value="" disabled>
          Loading libraries...
        </option>
      ) : error ? (
        <option value="" disabled>
          Unable to load library list
        </option>
      ) : (
        <>
          {includeAllOption && <option value="">{allOptionLabel}</option>}
          {displayLibraries.map((lib) => {
            const val = lib.code || lib._id || lib.id;
            return (
              <option key={val} value={val}>
                {lib.name}
              </option>
            );
          })}
        </>
      )}
    </Select>
  );
};

export default LibrarySelect;
