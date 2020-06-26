declare module 'covgen' {
  function download(email: string, dest?: string): Promise<void>

  export = download
}
