import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Link } from '../links/links.entity';
import { TemporaryCollection } from './temporary-collection.entity';

/** Join table: which links belong to a temporary collection. */
@Entity({ name: 'link_collections' })
export class LinkCollectionMembership {
  @PrimaryColumn({ name: 'link_id', type: 'uuid' })
  linkId: string;

  @PrimaryColumn({ name: 'collection_id', type: 'uuid' })
  collectionId: string;

  @ManyToOne(() => Link, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'link_id' })
  link: Link;

  @ManyToOne(() => TemporaryCollection, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'collection_id' })
  collection: TemporaryCollection;
}
