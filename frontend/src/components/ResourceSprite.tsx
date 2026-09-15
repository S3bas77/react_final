import { ResourceType } from '../types';
import './Sprites.css';

export default function ResourceSprite({ type }: { type: ResourceType }) {
  return <div className={`resource resource-${type}`} data-testid="resource" />;
}
