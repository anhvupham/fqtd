//------------------------------------------------------------------------------
// <auto-generated>
//    This code was generated from a template.
//
//    Manual changes to this file may cause unexpected behavior in your application.
//    Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace fqtd.Areas.Admin.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class Categories
    {
        public Categories()
        {
            this.tbl_Brands = new HashSet<Brands>();
            this.tbl_Properties = new HashSet<Properties>();
        }
    
        public int CategoryID { get; set; }
        public string CategoryName { get; set; }
        public string Description { get; set; }
        public string CategoryName_EN { get; set; }
        public string Description_EN { get; set; }
        public bool IsActive { get; set; }
        public System.DateTime CreateDate { get; set; }
        public string CreateUser { get; set; }
        public Nullable<System.DateTime> ModifyDate { get; set; }
        public string ModifyUser { get; set; }
        public Nullable<System.DateTime> DeleteDate { get; set; }
        public string DeleteUser { get; set; }
    
        public virtual ICollection<Brands> tbl_Brands { get; set; }
        public virtual ICollection<Properties> tbl_Properties { get; set; }
    }
}
