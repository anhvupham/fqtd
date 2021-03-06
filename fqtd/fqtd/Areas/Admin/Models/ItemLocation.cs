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
    
    public partial class ItemLocation
    {
        public int ItemID { get; set; }
        public string FullAddress { get; set; }
        public string FullAddress_USign { get; set; }
        public string AddressNumber { get; set; }
        public string Street { get; set; }
        public string Ward { get; set; }
        public string Distrist { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public string Street_USign { get; set; }
        public string Ward_USign { get; set; }
        public string Distrist_USign { get; set; }
        public string City_USign { get; set; }
        public string Country_USign { get; set; }
        public string MapAddress { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        public bool IsActive { get; set; }
        public System.DateTime CreateDate { get; set; }
        public string CreateUser { get; set; }
        public Nullable<System.DateTime> ModifyDate { get; set; }
        public string ModifyUser { get; set; }
        public Nullable<System.DateTime> DeleteDate { get; set; }
        public string DeleteUser { get; set; }
    
        public virtual BrandItems tbl_Brand_Items { get; set; }
    }
}
