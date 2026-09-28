import React from 'react';
import { BookCatalog } from '../../components/books/BookCatalog';

export const FacultyCatalog = () => {
  return (
    <BookCatalog
      mode="faculty"
      title="Faculty Book Catalog & Search"
      description="Search books, check copy availability across KIET, KIET 2, and KIET Women's Libraries."
    />
  );
};
