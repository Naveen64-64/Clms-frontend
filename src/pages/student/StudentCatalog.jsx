import React from 'react';
import { BookCatalog } from '../../components/books/BookCatalog';

export const StudentCatalog = () => {
  return (
    <BookCatalog
      mode="student"
      title="Student Book Search"
      description="Explore recommended course textbooks, check copy availability across KIET campuses, and inspect physical holdings."
    />
  );
};
