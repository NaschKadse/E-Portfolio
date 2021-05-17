import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Product} from './product.model';

@model({
  settings: {
    foreignKeys: {
      fk_order_userId: {
        name: 'fk_order_userId',
        entity: 'User',
        entityKey: 'id',
        foreignKey: 'userId',
        onUpdate: 'restrict',
        onDelete: 'cascade',
      },
      fk_order_productId: {
        name: 'fk_order_productId',
        entity: 'Product',
        entityKey: 'id',
        foreignKey: 'productId',
        onUpdate: 'restrict',
        onDelete: 'cascade',
      },
    },
  },
})
export class Order extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  pieces: number;

  @property({
    type: 'date',
    required: true,
  })
  date: string;

  @property({
    type: 'number',
  })
  userId?: number;

  @belongsTo(() => Product)
  productId: number;

  constructor(data?: Partial<Order>) {
    super(data);
  }
}

export interface OrderRelations {
  // describe navigational properties here
}

export type OrderWithRelations = Order & OrderRelations;
