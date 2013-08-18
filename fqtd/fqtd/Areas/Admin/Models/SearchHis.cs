using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace fqtd.Areas.Admin.Models
{
    public class KeywordHis
    {
        public KeywordHis(string Keyword, string SearchCount) { }
        public string Keyword { get; set; }
        public int SearchCount { get; set; }
    }
}