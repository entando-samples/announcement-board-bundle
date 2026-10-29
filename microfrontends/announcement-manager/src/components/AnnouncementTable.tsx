import type { Announcement } from '../types';

interface AnnouncementTableProps {
  items: Announcement[];
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
}

export default function AnnouncementTable({ items, onEdit, onDelete }: AnnouncementTableProps) {
  if (items.length === 0) {
    return <p>No announcements yet. Create the first one.</p>;
  }
  return (
    <table className="announcement-manager__table">
      <thead>
        <tr>
          <th scope="col">Title</th>
          <th scope="col">Category</th>
          <th scope="col">Status</th>
          <th scope="col">Updated</th>
          <th scope="col">
            <span className="announcement-manager__sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.title}</td>
            <td>{item.category}</td>
            <td>{item.status}</td>
            <td>{new Date(item.updatedAt).toLocaleString()}</td>
            <td className="announcement-manager__actions">
              <button type="button" onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`}>
                Edit
              </button>
              <button type="button" onClick={() => onDelete(item)} aria-label={`Delete ${item.title}`}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
