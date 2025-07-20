export interface BookOptions {
  book: {
    src: string;
    title?: string;
    authors?: string[];
    description?: string;
    language?: string;
    /**
     * unsupported
     */
    "text-direction"?: "ltr" | "rtl";
  };
  /**
   * unsupported
   */
  rust?: {
    edition?: "2015" | "2018" | "2021";
  };
  /**
   * unsupported
   */
  build?: {
    "build-dir"?: string;
    "create-missing"?: boolean;
    "use-default-preprocessors"?: boolean;
    "extra-watch-dirs"?: string[];
  };
  /**
   * unsupported
   */
  preprocessor?: {
    [key: string]: any;
  };
  output?: {
    html?: {
      code: {
        hidelines: Record<string, string>;
      };
      /**
       * unsupported
       */
      "additional-css"?: string[];
      /**
       * unsupported
       */
      search?: {
        "limit-results"?: number;
      };
    };
  };
}
