export class RoomHubDto {
  id: string;
  name: string;
  myRole?: string;
  widgets: {
    id: string;
    type: string;
    name: string;
  }[];
}
