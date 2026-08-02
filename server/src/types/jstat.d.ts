declare module "jstat" {
  interface Distribution {
    cdf(value: number, ...parameters: number[]): number;
    inv(probability: number, ...parameters: number[]): number;
  }

  interface JStatApi {
    normal: Distribution;
    studentt: Distribution;
    centralF: Distribution;
    chisquare: Distribution;
  }

  const jStat: JStatApi;
  export default jStat;
}
