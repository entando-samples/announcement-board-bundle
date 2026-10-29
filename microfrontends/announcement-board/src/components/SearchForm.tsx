import { useState, type FormEvent } from 'react';
import { CATEGORIES, type Category } from '../types';

interface SearchFormProps {
  initialText: string;
  category?: Category;
  showText: boolean;
  onSearch: (text: string, category?: Category) => void;
}

export default function SearchForm({ initialText, category, showText, onSearch }: SearchFormProps) {
  const [text, setText] = useState(initialText);
  const [selected, setSelected] = useState<Category | ''>(category ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(showText ? text.trim() : '', selected || undefined);
  };

  return (
    <form className="announcement-board__search" role="search" onSubmit={submit}>
      {showText && (
        <input
          type="search"
          aria-label="Search text"
          placeholder="Search announcements"
          maxLength={100}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      )}
      <select
        aria-label="Category"
        value={selected}
        onChange={(event) => setSelected(event.target.value as Category | '')}
      >
        <option value="">All categories</option>
        {CATEGORIES.map((value) => (
          <option key={value} value={value}>
            {value.charAt(0) + value.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
      <button type="submit">Search</button>
    </form>
  );
}
