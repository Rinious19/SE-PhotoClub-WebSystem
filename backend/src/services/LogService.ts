export class LogService {
  static async create(log: {
    actor: string;
    action: string;
    target: string;
    detail: string;
  }) {
    console.log("LOG:", log);

    // 👉 TODO: save ลง database
  }
}